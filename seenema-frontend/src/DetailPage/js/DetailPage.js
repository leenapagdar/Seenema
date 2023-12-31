import React, {useContext, useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import api from '../../Homepage/js/api';
import '../css/DetailPage.css';
import starImage from '../../assets/Star.png';
import {AuthContext} from "../../Auth/js/AuthContext";
import '../../SuggestionsListPage/css/SuggestedMoviesList.css';
import Select from 'react-select';
import * as SelectedFriend from "@material-tailwind/react/context/theme";
import {useCookies} from 'react-cookie';
import Loading from "../../assets/loading.json";
import Lottie from "lottie-react";
import placeHolderImage from '../../assets/placeholderImage.png';

// DetailPage component definition
const DetailPage = () => {
    // State variables for storing movie data
    const [movie, setMovie] = useState(null);
    const [cast, setCast] = useState([]);
    const [director, setDirector] = useState('');
    const [ageRating, setAgeRating] = useState('Not Rated');
    const [videos, setVideos] = useState([]);
    const [streamingServices, setStreamingServices] = useState(null);
    const {user} = useContext(AuthContext);
    const [watchlistButtonLoading, setWatchlistButtonLoading] = useState(false);
    const {movieId} = useParams();
    const [friendEmail, setFriendEmail] = useState("");
    const [addedToWatchlist, setAddedToWatchlist] = useState(false);
    let {userEmail} = useParams();
    userEmail = user ? user.email : "";
    const [showDropdown, setShowDropdown] = useState(false);
    const [friendsList, setFriendsList] = useState(new Set());
    const [selectedFriend, setSelectedFriend] = useState(null);
    let rating = "";
    const [cookies, setCookie, removeCookie] = useCookies(['userToken']);
    const userToken = cookies.userToken;
    const [buttonState, setButtonState] = useState("default");
    const [buttonColor, setButtonColor] = useState("default");
    const [suggestedMovie, setSuggestedMovie] = useState(false);
    const [friendSuggestionLoading, setFriendSuggestionLoading] = useState(false);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    // Function to handle navigating back
    const handleGoBack = () => {
        navigate(-1)
    }

    // Function to toggle the friend suggestion dropdown
    const handleToggleDropdown = () => {
        setShowDropdown(!showDropdown);
        setSuggestedMovie(false);
    };

    // Function to handle friend suggestion click
    const handleFriendClick = async (friendEmail) => {
        try {
            if (!user) {
                // User is not logged in, navigate to the homepage
                navigate('/signIn');
                return;
            }

            setFriendSuggestionLoading(true);
            // Call the function to add the movie to the friend's suggestion list
            handleAddToSuggestionsList(SelectedFriend.value);

            // Change the button color to "success" for 5 seconds
            setButtonColor("success");
            setTimeout(() => {
                setButtonColor("default");
                // Close the dropdown after 5 seconds if it is open
                setShowDropdown(false);
            }, 2000);
        } catch (error) {
            console.error('Error handling friend click:', error);
        } finally {
            setFriendSuggestionLoading(false);
        }
    };

    // Fetch movie details on component mount or when the movieId changes
    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                // Fetch and set the main movie details
                const movieResponse = await api.get(`/movie/${movieId}`);
                setMovie(movieResponse.data);

                // Fetch and set streaming service details
                const streamingServicesResponse = await api.get(`/movie/${movieId}/watch/providers`);
                console.log(streamingServicesResponse.data.results);
                setStreamingServices(streamingServicesResponse.data.results);

                // Fetch and set movie release dates for rating
                const releaseDatesResponse = await api.get(`/movie/${movieId}/release_dates`);
                const releaseDatesData = releaseDatesResponse.data;

                // Extract the MPA rating for the US (if available)
                const usReleaseDates = releaseDatesData.results.find(r => r.iso_3166_1 === 'US');
                if (usReleaseDates && usReleaseDates.release_dates[0].certification) {
                    setAgeRating(usReleaseDates.release_dates[0].certification);
                } else {
                    setAgeRating('Not Rated');
                }

                // Fetch cast and director details
                const creditsResponse = await api.get(`/movie/${movieId}/credits`);
                const castData = creditsResponse.data.cast;
                const directorData = creditsResponse.data.crew.find(crewMember => crewMember.job === 'Director');

                // Set state for cast (limited to 10 members) and director
                setCast(castData.slice(0, 10));
                setDirector(directorData ? directorData.name : 'N/A');

                // Fetch and set trailers, clips, and teasers
                const videosResponse = await api.get(`/movie/${movieId}/videos`);
                const allVideos = videosResponse.data.results;

                // Filter for trailers, clips, and teasers
                const trailers = allVideos.filter(video => video.type === 'Trailer');
                const teasersAndClips = allVideos.filter(video => video.type === 'Teaser' || video.type === 'Clip');

                // Select videos based on priority
                let selectedVideos = [];
                if (trailers.length > 0) {
                    selectedVideos.push(trailers[0]); // First priority is trailer
                    if (teasersAndClips.length > 0) {
                        selectedVideos.push(teasersAndClips[0]); // Second priority is a teaser or clip
                    }
                } else if (teasersAndClips.length > 0) {
                    selectedVideos = teasersAndClips.slice(0, 2); // If no trailer, select up to two teasers/clips
                }

                // Set the selected videos
                setVideos(selectedVideos);
                setIsLoading(false);

            } catch (error) {
                console.error('Error fetching details:', error);
                setIsLoading(false);
            }
        };

        fetchMovieDetails();
    }, [movieId]); // Effect dependency on movieId

    // Fetch user watchlist information on component mount or when userToken changes
    useEffect(() => {
        const fetchMovieDetails = async () => {
            try {
                // Fetch the user's watchlist information
                const isMovieInList = user ? await isMovieInMyList(userToken, movieId) : false;

                // Set the state to reflect whether the movie is in the user's watchlist
                setAddedToWatchlist(isMovieInList);

                // Notify other tabs/windows about the change
                window.postMessage({type: 'watchlistUpdated', movieId, isMovieInList}, '*');

            } catch (error) {
                console.error('Error fetching details:', error);
            }
        };

        fetchMovieDetails();
    }, [movieId, userToken]); // Effect dependency on movieId and userEmail

    // Fetch user information on component mount
    const fetchUserInfo = async () => {
        try {
            const response = await fetch('https://9acdf5s7k2.execute-api.us-west-2.amazonaws.com/dev/getUserInfo', {
                method: 'POST',
                body: JSON.stringify({Email: user.email})
            });

            if (response.ok) {
                const userInfo = await response.json();
                // Update state based on the fetched user information
                setAddedToWatchlist(userInfo.Movies.includes(movieId));
                if (userInfo.Friends && Array.isArray(userInfo.Friends)) {
                    const friendEmails = userInfo.Friends;
                    setFriendsList(new Set(friendEmails));
                } else {
                    console.error("Invalid friend list data:", userInfo);
                }
            } else {
                console.error('Failed to fetch user information:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching user information:', error.message);
        }
    };


    // Function to add movies to user's my list
    const handleAddToMyList = async () => {
        try {
            setWatchlistButtonLoading(true);
            const response = await fetch('https://9acdf5s7k2.execute-api.us-west-2.amazonaws.com/dev/addMovieToMyList', {
                method: 'POST',
                body: JSON.stringify({
                    username: userEmail,
                    movieId: movieId,
                }),
            });

            if (response.ok) {
                console.log('Movie added to My List successfully!');
                console.log('Before setting addedToWatchlist:', addedToWatchlist);
                setAddedToWatchlist(true); // Set the state to indicate that the movie has been added
                localStorage.setItem('watchlist', JSON.stringify([...(JSON.parse(localStorage.getItem('watchlist')) || []), movieId]));
                console.log('After setting addedToWatchlist:', addedToWatchlist);
            } else {
                console.error('Failed to add movie to My List:', response.status, response.statusText);
            }
            // Notify other tabs/windows about the change
            window.postMessage({type: 'watchlistUpdated', movieId, isMovieInList: true}, '*');
        } catch (error) {
            console.error('Error adding movie to My List:', error.message);
        } finally {
            setWatchlistButtonLoading(false);
        }
    };

    // Function to add movies to friend's suggestion list
    const handleAddToSuggestionsList = async () => {
        try {
            setFriendSuggestionLoading(true);
            const response = await fetch(' https://9acdf5s7k2.execute-api.us-west-2.amazonaws.com/dev/addMoviesToFriendsSuggestionsList', {
                method: 'POST',
                body: JSON.stringify({
                    username: user.email,
                    friendUsername: selectedFriend.value,
                    movieId: movieId,
                }),
            });

            if (response.ok) {
                console.log('Movie added to' + friendEmail + 'Suggestions List successfully!');
                setSuggestedMovie(true);
            } else {
                console.error('Failed to add movie to Suggestions List:', response.status, response.statusText);
                setSuggestedMovie(false);
            }
        } catch (error) {
            console.error('Error adding movie to Suggestions List:', error.message);
        } finally {
            setFriendSuggestionLoading(false);
        }
    };

    // Function to check if a movie is in the user's watchlist
    const isMovieInMyList = async (userEmail, movieId) => {
        try {
            // Fetch the user's watchlist information from local storage
            const watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
            // Check if the current movie is in the user's watchlist
            const isMovieInList = watchlist.includes(movieId);
            return isMovieInList;
        } catch (error) {
            console.error('Error fetching my list:', error.message);
            return false;
        }
    };

    // Effect to call isMovieInMyList on component mount
    useEffect(() => {
        isMovieInMyList(userEmail, movieId);
    }, []);

    // Call fetchUserInfo when the component mounts
    useEffect(() => {
        fetchUserInfo();
    }, []); // Call fetchUserInfo on component mount


    // Render loading text if data is not yet loaded
    if (isLoading) {
        return <div>Loading...</div>;
    }
    // Calculating average rating of movie, setting it 'N/A' if avg rating is < 0
    rating = movie.vote_average && movie.vote_average >= 1 ? movie.vote_average.toFixed(1) : 'N/A'

    // Formatted data for display
    const formattedReleaseYear = new Date(movie.release_date).getFullYear();
    const formattedRuntime = movie.runtime;
    const formattedGenres = movie.genres.map((genre) => genre.name).join(', ');
    const formattedCastNames = cast.map((actor) => actor.name).join(', ');

    const handleButtonClick = async () => {
        try {
            if (!user) {
                // User is not logged in, navigate to the homepage
                navigate('/signIn');
                return;
            }
            // Set loading state to true only for the "Add to Watchlist" button
            setWatchlistButtonLoading(true);

            if (addedToWatchlist) {
                // Handle the case where the movie is already in the watchlist
                console.log('Movie is already in the watchlist');
            } else {
                // Handle the case where the movie is not in the watchlist
                await handleAddToMyList();
            }
        } catch (error) {
            console.error('Error handling button click:', error);
        } finally {
            // Reset loading state only for the "Add to Watchlist" button
            setWatchlistButtonLoading(false);
        }
    };

    const posterImageUrl = movie && movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : placeHolderImage;

    const backdropImageUrl = movie && movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : '';


    // Main return statement for rendering the detail page
    return (
        <div className="detail-body">
            <div className="button-back-container">
                <button onClick={handleGoBack} className="generic-button button-back">Back</button>
            </div>
            <div className="movie-detail-page">
                <div className="detail-movie-container">
                    {movie.backdrop_path && (
                        <img src={backdropImageUrl} alt={movie ? movie.title : 'Background not available'}
                             className={`detail-background-image`}/>
                    )}
                    <img src={posterImageUrl} alt={movie ? movie.title : 'Poster not available'}
                         className="detail-movie-poster"/>
                    <h1 className="detail-movie-title">{movie.title}</h1>
                    <div className="detail-movie-info">
                        <div className="detail-user-rating-box">
                            <img src={starImage} alt="Star" className="detail-user-rating-star"/>
                            <span>{rating}</span>
                        </div>
                        <span className="detail-year">{formattedReleaseYear}</span>
                        <span className="detail-movie-runtime">{formattedRuntime} min</span>
                        <span className="detail-movie-MPArating">{ageRating}</span>
                    </div>
                    <div className="detail-movie-genre-list">
                        {formattedGenres}
                    </div>
                    <p className="detail-movie-overview">{movie.overview}</p>
                    <div className="detail-movie-cast">
                        <span className="detail-cast-title">Starring : </span>
                        {cast.length > 0 ? formattedCastNames : 'N/A'}
                    </div>
                    <div className="detail-movie-director">
                        <span className="detail-cast-title">Director : </span>
                        <span>{director}</span>
                    </div>
                    <div className="button-container">
                        {watchlistButtonLoading ? (
                            <div className="loading-container-detail-page">
                                <Lottie loop={true} animationData={Loading}/>
                            </div>
                        ) : (
                            <button
                                className={`generic-button button-watchlist ${addedToWatchlist ? 'added-to-watchlist' : ''}`}
                                onClick={handleButtonClick}
                                disabled={addedToWatchlist}
                            >
                                {addedToWatchlist ? 'Added to Watchlist' : 'Add to Watchlist'}
                            </button>
                        )}
                        <div>
                            {showDropdown ? (
                                <div>
                                    <div className="add-to-friendList-field">
                                        <div className="select-friend-detail">
                                            <Select
                                                options={Array.from(friendsList).map((friend) => ({
                                                    value: friend,
                                                    label: friend,
                                                }))}
                                                value={selectedFriend}
                                                onChange={(selectedOption) => setSelectedFriend(selectedOption)}
                                                placeholder="Select friend"
                                                style={{color: 'black'}}
                                            />
                                        </div>
                                        <button
                                            className={`generic-button  detail-done-button ${suggestedMovie ? 'detail-done-after-suggesting-friend-button' : ''}`}
                                            onClick={() => handleFriendClick(selectedFriend ? selectedFriend.value : '')}
                                            disabled={suggestedMovie}
                                        >
                                            {suggestedMovie ?
                                                <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px"
                                                     fill="currentColor"
                                                     className=" bi bi-check detail-done-after-suggesting-friend-button"
                                                     viewBox="0 0 16 16">
                                                    <path
                                                        d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                                </svg>
                                                :
                                                <svg xmlns="http://www.w3.org/2000/svg" width="30px" height="30px"
                                                     fill="currentColor" className="bi bi-check" viewBox="0 0 16 16">
                                                    <path
                                                        d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                                </svg>}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="generic-button button-add-friend-suggestions-list"
                                    onClick={handleToggleDropdown}
                                    style={{display: showDropdown ? 'none' : 'block'}}
                                >
                                    Suggest to a friend
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="watch-on-services">
                        <h2 style={{fontWeight: "bold"}}>Available on:</h2>
                        <div className="services-container">
                            {streamingServices && streamingServices.US && streamingServices.US.flatrate && streamingServices.US.flatrate.length > 0 ? (
                                streamingServices.US.flatrate.map((service) => (
                                    <div key={service.provider_id} className="service">
                                        <img src={`https://image.tmdb.org/t/p/w500${service.logo_path}`}
                                             alt={service.provider_name}/>
                                    </div>
                                ))
                            ) : (
                                <p>Not available to stream</p>
                            )}
                        </div>
                    </div>

                    <div className="trailers-and-clips">
                        <h2 style={{fontWeight: "bold"}}>Trailers and Clips</h2>
                        <div className="videos">
                            {videos.length > 0 ? (
                                videos.map((video) => (
                                    <iframe
                                        key={video.id}
                                        width="560"
                                        height="315"
                                        src={`https://www.youtube.com/embed/${video.key}`}
                                        title={video.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="video-iframe"
                                    ></iframe>
                                ))
                            ) : (
                                <p className="no-trailers-text">No trailers or clips available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DetailPage;
