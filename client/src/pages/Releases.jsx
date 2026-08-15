import React, { useEffect, useState } from 'react'
import { StarIcon } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import BlurCircle from '../components/BlurCircle'
import Loading from '../components/Loading'

const Releases = () => {
  const { axios, image_base_url } = useAppContext()
  const [upcomingMovies, setUpcomingMovies] = useState(null) // null = still loading

  const fetchUpcoming = async () => {
    try {
      const { data } = await axios.get('/api/show/upcoming')
      setUpcomingMovies(data.success ? data.movies : [])
    } catch (error) {
      console.error(error)
      setUpcomingMovies([])
    }
  }

  useEffect(() => { fetchUpcoming() }, [])

  if (upcomingMovies === null) return <Loading />

  return (
    <div className='relative px-6 md:px-16 lg:px-24 xl:px-44 pt-30 pb-20 min-h-[70vh]'>
      <BlurCircle top='150px' left='0px' />
      <h1 className='text-lg font-medium mb-6'>Upcoming Releases</h1>

      {upcomingMovies.length === 0 ? (
        <p className='text-gray-400'>No upcoming releases to show right now.</p>
      ) : (
        <div className='flex flex-wrap gap-6'>
          {upcomingMovies.map((movie) => (
            <div key={movie.id} className='w-40 flex flex-col'>
              <div className='rounded-lg overflow-hidden bg-gray-800 h-56'>
                {movie.poster_path && (
                  <img src={image_base_url + movie.poster_path} alt={movie.title} className='w-full h-full object-cover'/>
                )}
              </div>
              <p className='font-medium mt-2 truncate'>{movie.title}</p>
              <p className='text-sm text-gray-400'>{movie.release_date}</p>
              <p className='flex items-center gap-1 text-sm text-gray-400 mt-1'>
                <StarIcon className='w-4 h-4 text-primary fill-primary'/>
                {movie.vote_average.toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Releases