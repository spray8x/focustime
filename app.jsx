import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, Check, Settings } from 'lucide-react';

export default function StudyPomodoroApp() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [time, setTime] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistId, setPlaylistId] = useState('');
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentVideoId, setCurrentVideoId] = useState('');
  const [player, setPlayer] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('auto');
  const [showControls, setShowControls] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  
  // Add your YouTube API key here:
  const API_KEY = 'YOUR_API_KEY_HERE';

  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      console.log('YouTube API ready');
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime(t => t - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
      setIsBreak(!isBreak);
      setTime(isBreak ? focusMinutes * 60 : breakMinutes * 60);
    }
    return () => clearInterval(interval);
  }, [isActive, time, isBreak, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (currentVideoId && window.YT && window.YT.Player) {
      if (player) {
        player.loadVideoById(currentVideoId);
      } else {
        const newPlayer = new window.YT.Player('youtube-player', {
          videoId: currentVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            modestbranding: 1,
            rel: 0
          },
          events: {
            onReady: (event) => {
              setPlayer(event.target);
            }
          }
        });
      }
    }
  }, [currentVideoId]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTime(focusMinutes * 60);
    setIsBreak(false);
  };

  const updateTimerSettings = () => {
    setTime(isBreak ? breakMinutes * 60 : focusMinutes * 60);
    setShowSettings(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const extractPlaylistId = (url) => {
    const match = url.match(/[?&]list=([^&]+)/);
    return match ? match[1] : null;
  };

  const loadPlaylist = async () => {
    const id = extractPlaylistId(playlistUrl);
    if (!id) {
      alert('Invalid playlist URL');
      return;
    }
    
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      alert('Please add your YouTube API key in the code (line 19)');
      return;
    }
    
    setIsLoadingPlaylist(true);
    setPlaylistId(id);
    
    try {
      let allVideos = [];
      let nextPageToken = '';
      
      // Fetch all videos from playlist (handling pagination)
      do {
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${id}&key=${API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error.message);
        }
        
        const videos = data.items.map((item, index) => ({
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          index: allVideos.length + index
        }));
        
        allVideos = [...allVideos, ...videos];
        nextPageToken = data.nextPageToken || '';
        
      } while (nextPageToken);
      
      setPlaylistVideos(allVideos);
      if (allVideos.length > 0) {
        setCurrentVideoId(allVideos[0].videoId);
        setCurrentVideoIndex(0);
      }
    } catch (error) {
      console.error('Error loading playlist:', error);
      alert(`Failed to load playlist: ${error.message}. Please check your API key and try again.`);
    } finally {
      setIsLoadingPlaylist(false);
    }
  };

  const changePlaybackRate = (rate) => {
    if (player) {
      player.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  const changeQuality = (qual) => {
    if (player) {
      const levels = player.getAvailableQualityLevels();
      if (qual === 'auto') {
        player.setPlaybackQuality('default');
      } else {
        player.setPlaybackQuality(qual);
      }
      setQuality(qual);
    }
  };

  const selectVideo = (video, index) => {
    setCurrentVideoId(video.videoId);
    setCurrentVideoIndex(index);
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="h-screen bg-black text-gray-300 p-4 font-mono overflow-hidden">
      <div className="h-full">
        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
          {/* Top Left - Timer */}
          <div className="bg-black border border-gray-700 rounded-lg p-6 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                # {isBreak ? 'break_time' : 'focus_time'}
              </h2>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-gray-400 hover:text-white transition"
              >
                <Settings size={20} />
              </button>
            </div>
            
            {showSettings ? (
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div>
                  <label className="text-gray-400 text-sm block mb-2">focus_duration (minutes)</label>
                  <input
                    type="number"
                    value={focusMinutes}
                    onChange={(e) => setFocusMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm block mb-2">break_duration (minutes)</label>
                  <input
                    type="number"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={updateTimerSettings}
                  className="bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-600 px-4 py-2 rounded transition"
                >
                  save_settings
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                <div className="text-8xl font-bold text-center text-green-400 mb-8">
                  {formatTime(time)}
                </div>
                <div className="flex gap-3 justify-center mb-6">
                  <button
                    onClick={toggleTimer}
                    className="bg-gray-800 hover:bg-gray-700 text-green-400 border border-gray-600 p-6 rounded transition"
                  >
                    {isActive ? <Pause size={32} /> : <Play size={32} />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-600 p-6 rounded transition"
                  >
                    <RotateCcw size={32} />
                  </button>
                </div>
                <div className="text-center text-gray-500 text-sm">
                  <p>focus: {focusMinutes} min | break: {breakMinutes} min</p>
                </div>
              </div>
            )}
          </div>

          {/* Top Right - YouTube Player */}
          <div className="bg-black border border-gray-700 rounded-lg p-6 flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold text-white mb-4"># video_player</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadPlaylist()}
                placeholder="paste_youtube_playlist_url..."
                className="flex-1 px-4 py-2 bg-black border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                onClick={loadPlaylist}
                disabled={isLoadingPlaylist}
                className="bg-gray-800 hover:bg-gray-700 text-blue-400 border border-gray-600 px-6 py-2 rounded font-semibold transition disabled:opacity-50"
              >
                {isLoadingPlaylist ? 'loading...' : 'load'}
              </button>
            </div>
            
            <div className="flex-1 min-h-0 flex flex-col">
              {currentVideoId ? (
                <>
                  <div 
                    className="relative flex-1 bg-black rounded-lg overflow-hidden border border-gray-700"
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(false)}
                  >
                    <div id="youtube-player" className="w-full h-full"></div>
                    
                    {showControls && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <div className="flex gap-4 items-center">
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-gray-400">speed:</span>
                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                              <button
                                key={rate}
                                onClick={() => changePlaybackRate(rate)}
                                className={`px-2 py-1 text-xs rounded transition ${
                                  playbackRate === rate 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-xs text-gray-400">quality:</span>
                            {['auto', 'hd1080', 'hd720', 'large', 'medium', 'small'].map(qual => (
                              <button
                                key={qual}
                                onClick={() => changeQuality(qual)}
                                className={`px-2 py-1 text-xs rounded transition ${
                                  quality === qual 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                {qual}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700">
                  <p className="text-gray-600">enter_playlist_url_to_start</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Left - Todo List */}
          <div className="bg-black border border-gray-700 rounded-lg p-6 flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold text-white mb-4"># todo_list</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="add_task..."
                className="flex-1 px-3 py-2 bg-black border border-gray-700 rounded text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                onClick={addTodo}
                className="bg-gray-800 hover:bg-gray-700 text-green-400 border border-gray-600 p-2 rounded transition"
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {todos.map(todo => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 p-2 bg-gray-900 rounded hover:bg-gray-800 transition"
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      todo.completed ? 'bg-green-500 border-green-500' : 'border-gray-600'
                    }`}
                  >
                    {todo.completed && <Check size={14} className="text-black" />}
                  </button>
                  <span className={`flex-1 text-sm ${todo.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                    {todo.text}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Right - Playlist View */}
          <div className="bg-black border border-gray-700 rounded-lg p-6 flex flex-col overflow-hidden">
            <h2 className="text-xl font-semibold text-white mb-4"># playlist</h2>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {playlistVideos.length > 0 ? (
                playlistVideos.map((video, index) => (
                  <div
                    key={index}
                    onClick={() => selectVideo(video, index)}
                    className={`p-3 rounded cursor-pointer transition ${
                      index === currentVideoIndex 
                        ? 'bg-gray-800 border border-blue-500' 
                        : 'bg-gray-900 hover:bg-gray-800 border border-gray-700'
                    }`}
                  >
                    <p className="text-sm text-gray-300 break-words">
                      {index + 1}. {video.title}
                    </p>
                  </div>
                ))
              ) : playlistId ? (
                <div className="text-gray-600 text-sm">
                  <p>loading_playlist...</p>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">
                  <p>load_a_playlist_to_see_videos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
