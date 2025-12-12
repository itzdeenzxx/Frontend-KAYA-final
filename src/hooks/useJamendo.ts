import { useState, useCallback } from 'react';

const JAMENDO_CLIENT_ID = 'c6646f96';
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

export interface JamendoTrack {
  id: string;
  name: string;
  duration: number;
  artist_id: string;
  artist_name: string;
  album_name: string;
  album_id: string;
  image: string;
  audio: string;
  audiodownload: string;
  audiodownload_allowed: boolean;
}

export interface JamendoResponse {
  headers: {
    status: string;
    code: number;
    error_message: string;
    results_count: number;
  };
  results: JamendoTrack[];
}

// Workout-friendly genres/tags
export const WORKOUT_GENRES = [
  { id: 'electronic', name: 'Electronic', icon: '🎛️' },
  { id: 'rock', name: 'Rock', icon: '🎸' },
  { id: 'hiphop', name: 'Hip Hop', icon: '🎤' },
  { id: 'pop', name: 'Pop', icon: '🎵' },
  { id: 'metal', name: 'Metal', icon: '🤘' },
  { id: 'dance', name: 'Dance', icon: '💃' },
  { id: 'house', name: 'House', icon: '🏠' },
  { id: 'techno', name: 'Techno', icon: '⚡' },
] as const;

export function useJamendo() {
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search tracks by query
  const searchTracks = useCallback(async (query: string, limit = 20) => {
    if (!query.trim()) {
      setTracks([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: limit.toString(),
        search: query,
        audioformat: 'mp32', // Good quality
        imagesize: '200',
        order: 'popularity_total_desc',
      });

      const response = await fetch(`${JAMENDO_API_BASE}/tracks/?${params}`);
      const data: JamendoResponse = await response.json();

      if (data.headers.status === 'success') {
        setTracks(data.results);
      } else {
        setError(data.headers.error_message || 'Failed to fetch tracks');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการค้นหาเพลง');
      console.error('Jamendo search error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get tracks by genre/tag
  const getTracksByGenre = useCallback(async (genre: string, limit = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: limit.toString(),
        tags: genre,
        audioformat: 'mp32',
        imagesize: '200',
        boost: 'popularity_total',
        speed: 'high+veryhigh', // Fast tracks for workout
      });

      const response = await fetch(`${JAMENDO_API_BASE}/tracks/?${params}`);
      const data: JamendoResponse = await response.json();

      if (data.headers.status === 'success') {
        setTracks(data.results);
      } else {
        setError(data.headers.error_message || 'Failed to fetch tracks');
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดเพลง');
      console.error('Jamendo genre error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get popular workout tracks
  const getWorkoutTracks = useCallback(async (limit = 20) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        client_id: JAMENDO_CLIENT_ID,
        format: 'json',
        limit: limit.toString(),
        fuzzytags: 'workout+fitness+energy+motivational',
        audioformat: 'mp32',
        imagesize: '200',
        order: 'popularity_total_desc',
        speed: 'high+veryhigh',
      });

      const response = await fetch(`${JAMENDO_API_BASE}/tracks/?${params}`);
      const data: JamendoResponse = await response.json();

      if (data.headers.status === 'success') {
        setTracks(data.results);
      } else {
        // Fallback to electronic if no workout-specific tracks
        await getTracksByGenre('electronic', limit);
      }
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการโหลดเพลง');
      console.error('Jamendo workout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getTracksByGenre]);

  const clearTracks = useCallback(() => {
    setTracks([]);
    setError(null);
  }, []);

  return {
    tracks,
    isLoading,
    error,
    searchTracks,
    getTracksByGenre,
    getWorkoutTracks,
    clearTracks,
  };
}

// Format duration from seconds to mm:ss
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
