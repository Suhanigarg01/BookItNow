import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from 'lucide-react'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {

 const [isOpen, setIsOpen] = useState(false)
 const [isSearchOpen, setIsSearchOpen] = useState(false)
 const [searchQuery, setSearchQuery] = useState('')
 const {user} = useUser()
 const {openSignIn} = useClerk()

 const navigate = useNavigate()

 const {favoriteMovies, shows, image_base_url} = useAppContext()

 const searchResults = searchQuery.trim()
    ? shows.filter(movie => movie.title.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 6)
    : []

 const goToMovie = (id) => {
    navigate(`/movies/${id}`)
    scrollTo(0, 0)
    setSearchQuery('')
    setIsSearchOpen(false)
 }

  return (
    <div className='fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5'>
      <Link to='/' className='max-md:flex-1'>
        <img src={assets.logo} alt="" className='w-36 h-auto'/>
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}`}>

        <XIcon className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer' onClick={()=> setIsOpen(!isOpen)}/>

        <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/'>Home</Link>
        <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/movies'>Movies</Link>
        <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/releases'>Releases</Link>
       {favoriteMovies.length > 0 && <Link onClick={()=> {scrollTo(0,0); setIsOpen(false)}} to='/favorite'>Favorites</Link>}
      </div>

    <div className='flex items-center gap-8'>
        <div className='relative max-md:hidden'>
            {isSearchOpen ? (
                <input
                    autoFocus
                    type='text'
                    value={searchQuery}
                    onChange={(e)=> setSearchQuery(e.target.value)}
                    onBlur={()=> setTimeout(()=> {setIsSearchOpen(false); setSearchQuery('')}, 150)}
                    placeholder='Search movies...'
                    className='bg-white/10 border border-gray-300/20 rounded-full px-4 py-1.5 text-sm outline-none w-56'
                />
            ) : (
                <SearchIcon className='w-6 h-6 cursor-pointer' onClick={()=> setIsSearchOpen(true)}/>
            )}

            {isSearchOpen && searchQuery.trim() && (
                <div className='absolute top-10 right-0 w-72 max-h-80 overflow-y-auto bg-gray-900 border border-gray-300/20 rounded-lg shadow-lg'>
                    {searchResults.length > 0 ? searchResults.map((movie)=>(
                        <div key={movie._id} onMouseDown={()=> goToMovie(movie._id)}
                         className='flex items-center gap-3 p-2 hover:bg-white/10 cursor-pointer'>
                            <img src={image_base_url + movie.poster_path} alt="" className='w-10 h-14 object-cover rounded'/>
                            <div className='text-sm'>
                                <p className='truncate'>{movie.title}</p>
                                <p className='text-gray-400 text-xs'>{new Date(movie.release_date).getFullYear()}</p>
                            </div>
                        </div>
                    )) : (
                        <p className='p-3 text-sm text-gray-400'>No movies found.</p>
                    )}
                </div>
            )}
        </div>

        {
            !user ? (
                <button onClick={openSignIn} className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'>Login</button>
            ) : (
                <UserButton>
                    <UserButton.MenuItems>
                        <UserButton.Action label="My Bookings" labelIcon={<TicketPlus width={15}/>} onClick={()=> navigate('/my-bookings')}/>
                    </UserButton.MenuItems>
                </UserButton>
            )
        }
        
    </div>

    <MenuIcon className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer' onClick={()=> setIsOpen(!isOpen)}/>

    </div>
  )
}

export default Navbar