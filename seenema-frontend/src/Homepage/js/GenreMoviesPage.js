import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import MovieCard from './MovieCard';
import api from './api';
import Header from "./Header";
import Sidebar from "./Sidebar";
import '../css/GenreMoviesPage.css';
import Lottie from "lottie-react";
import NoResultsFound from "../../assets/NoResultsFound.json";

const GenreMoviesPage = () => {
    const [movies, setMovies] = useState([]);
    const [genreName, setGenreName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const {genreId} = useParams();
    const [isSearchActive, setIsSearchActive] = useState(false);
    const {searchTerm} = useParams();
    const navigate = useNavigate();

    // Function to search movies by genre
    const searchMoviesByGenre = useCallback(async (searchTerm) => {
        setLoading(true);
        try {
            let page = 1;
            let num_movies = 0;
            const {data} = await api.get(`/search/movie`, {
                params: {
                    query: searchTerm,
                    page: page
                }
            });
            let searchResults = data.results;
            let result = [];
            while (page <= data.total_pages && num_movies <= 20) {
                const {data} = await api.get(`/search/movie`, {
                    params: {
                        query: searchTerm,
                        page: page
                    }
                });
                page++;
                searchResults = data.results;
                for (let i = 0; i < searchResults.length; i++) {
                    const genre_ids = searchResults[i].genre_ids;
                    if (genre_ids !== undefined) {
                        const movieIsInGenre = genre_ids.some(genre_id => genre_id === Number(genreId));
                        if (movieIsInGenre) {
                            num_movies++;
                            result = result.concat(searchResults[i]);
                        }
                    }
                }
            }
            setMovies(result.splice(0, 20))
        } catch (error) {
            console.error('Error searching movies:', error);
            setLoading(false);
        }
    }, [genreId]);

    // Function to fetch movies by a specific genre
    const fetchMoviesByGenre = useCallback(async (page) => {
        setLoading(true);
        try {
            const response = await api.get(`/discover/movie`, {
                params: {
                    with_genres: genreId,
                    page: page
                }
            });
            if (page === 1) {
                setMovies(response.data.results.slice(0, 20));
            } else {
                setMovies(prev => [...prev, ...response.data.results]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching movies by genre:', error);
            setLoading(false);
        }
    }, [genreId]); // Add genreId as a dependency

    // Function to fetch the name of a genre
    const fetchGenreName = useCallback(async () => {
        try {
            const response = await api.get('/genre/movie/list');
            const genre = response.data.genres.find(g => g.id.toString() === genreId);
            if (genre) setGenreName(genre.name);
        } catch (error) {
            console.error('Error fetching genre name:', error);
        }
    }, [genreId]); // Add genreId as a dependency

    useEffect(() => {
        if (searchTerm !== undefined) {
            setIsSearchActive(true);
            searchMoviesByGenre(searchTerm);
            fetchGenreName();
        } else {
            setCurrentPage(1); // Reset page number on genre change
            setMovies([]); // Clear existing movies
            fetchMoviesByGenre(1); // Fetch first page of movies
            fetchGenreName();
        }
    }, [genreId, fetchMoviesByGenre, fetchGenreName]);

    // Function to handle 'Load More' button click
    const handleLoadMore = () => {
        const newPage = currentPage + 1;
        setCurrentPage(newPage);
        fetchMoviesByGenre(newPage);
    }

    // Function to handle search input changes
    const handleSearchChange = (value) => {
        if (value.trim() !== '') {
            searchMoviesByGenre(value);
            setIsSearchActive(true);
        } else {
            fetchMoviesByGenre(currentPage); // fetch current page of genre when search is cleared
            setIsSearchActive(false);
        }
    };

    // Function to handle genre changes
    const handleOnGenreChange = (selectedGenre) => {
        navigate(`/genre/${selectedGenre}`);
        setIsSearchActive(false);
    }

    return (
        <div className="home-layout">
            {/* Header component with search functionality */}
            <div><Header onSearch={handleSearchChange} isGenre={true} genreId={genreId}/></div>
            <div className="homepage-main-content">
                {/* Sidebar component for genre selection */}
                <div className="homepage-sidebar">
                    {/* Pass the genreId as selectedGenre */}
                    <Sidebar selectedGenre={parseInt(genreId)} onGenreChange={handleOnGenreChange}/>
                </div>
                {/* Main content area for displaying movies */}
                <div className="main-content-area-GenrePage">
                    {(searchTerm !== undefined) && (movies.length === 0) ? (
                        <>
                            <h2 className="genre-heading-GenreMoviePage">{'No ' + genreName + ' Movies Found'}</h2>
                            <div style={{width: "70%", paddingLeft: "30%", paddingTop: "10%"}}>
                                <Lottie loop={true} animationData={NoResultsFound}/>
                            </div>
                            <div className="movie-grid-genre-page">
                                {movies.map(movie => (
                                    <MovieCard key={movie.id} movie={movie}/>
                                ))}
                            </div>
                        </>
                    ) : (isSearchActive) ? (
                        <>
                            <h2 className="genre-heading-GenreMoviePage">{'Searched ' + genreName + ' Movies'}</h2>
                            <div className="movie-grid-genre-page">
                                {movies.map(movie => (
                                    <MovieCard key={movie.id} movie={movie}/>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="genre-heading-GenreMoviePage">{'All ' + genreName + ' Movies'}</h2>
                            <div className="movie-grid-genre-page">
                                {movies.map(movie => (
                                    <MovieCard key={movie.id} movie={movie}/>
                                ))}
                            </div>
                        </>
                    )}
                    {!loading && !isSearchActive && (
                        <div className="load-more-container-genre-page">
                            <button onClick={handleLoadMore} className="generic-button-load-more button-load-more">
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenreMoviesPage;
