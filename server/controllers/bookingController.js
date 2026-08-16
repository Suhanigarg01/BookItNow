import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js"
import stripe from 'stripe'

export const createBooking = async (req, res)=>{
    try {
        const {userId} = req.auth();
        const {showId, selectedSeats} = req.body;
        const { origin } = req.headers;

        // Build a query that only matches the Show if NONE of the selected
        // seats are already occupied, and an update that claims all of them.
        // MongoDB evaluates this as one atomic operation per document, so two
        // simultaneous requests for the same seat can't both succeed.
        const query = { _id: showId };
        const claim = {};
        selectedSeats.forEach(seat => {
            query[`occupiedSeats.${seat}`] = { $exists: false };
            claim[`occupiedSeats.${seat}`] = userId;
        });

        const showData = await Show.findOneAndUpdate(
            query,
            { $set: claim },
            { new: true }
        ).populate('movie');

        // showData is null if the show doesn't exist OR any seat was already taken
        if(!showData){
            return res.json({success: false, message: "Selected Seats are not available."})
        }

        // Seats are now claimed. Create the booking; if this fails, release the claim.
        let booking;
        try {
            booking = await Booking.create({
                user: userId,
                show: showId,
                amount: showData.showPrice * selectedSeats.length,
                bookedSeats: selectedSeats
            })
        } catch (err) {
            await releaseSeats(showId, selectedSeats);
            throw err;
        }

        // Stripe Gateway Initialize
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data:{ name: showData.movie.title },
                unit_amount: Math.floor(booking.amount) * 100
            },
            quantity: 1
        }]

        let session;
        try {
            session = await stripeInstance.checkout.sessions.create({
                success_url: `${origin}/loading/my-bookings`,
                cancel_url: `${origin}/my-bookings`,
                line_items,
                mode: 'payment',
                metadata: { bookingId: booking._id.toString() },
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
            })
        } catch (err) {
            // Stripe failed — undo both the booking and the seat claim
            await Booking.findByIdAndDelete(booking._id);
            await releaseSeats(showId, selectedSeats);
            throw err;
        }

        booking.paymentLink = session.url
        await booking.save()

        await inngest.send({
            name: "app/checkpayment",
            data: { bookingId: booking._id.toString() }
        })

        res.json({success: true, url: session.url})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Atomically release seats (used for rollback, and reusable by the Inngest cleanup job)
const releaseSeats = async (showId, seats)=>{
    const unset = {};
    seats.forEach(seat => { unset[`occupiedSeats.${seat}`] = ""; });
    await Show.findByIdAndUpdate(showId, { $unset: unset });
}

export const getOccupiedSeats = async (req, res)=>{
    try {
        const {showId} = req.params;
        const showData = await Show.findById(showId)
        const occupiedSeats = Object.keys(showData.occupiedSeats)
        res.json({success: true, occupiedSeats})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}