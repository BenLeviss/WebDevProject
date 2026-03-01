import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import type { Post } from '../api/posts';
import { postsApi } from '../api/posts';

export default function HomePage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data } = await postsApi.getPosts();
            setPosts(data.reverse()); // newest first
        } catch (err) {
            console.error('Failed to load posts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostCreated = (newPost: Post) => {
        setPosts((prev) => [newPost, ...prev]);
        setShowModal(false);
    };

    const handlePostDeleted = (id: string) => {
        setPosts((prev) => prev.filter((p) => p._id !== id));
    };

    return (
        <div className="app-layout">
            <Navbar />

            <main className="home-content">
                <div className="home-header">
                    <h2 className="home-title">📍 Discover Spots</h2>
                    <button
                        id="new-post-btn"
                        className="btn-new-post"
                        onClick={() => setShowModal(true)}
                    >
                        + New Spot
                    </button>
                </div>

                {loading ? (
                    <div className="spinner-wrap"><div className="spinner" /></div>
                ) : posts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📍</div>
                        <h3>No spots yet</h3>
                        <p>Be the first to share a spot!</p>
                    </div>
                ) : (
                    <div className="posts-list">
                        {posts.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                currentUserId={user?._id || ''}
                                onDeleted={handlePostDeleted}
                            />
                        ))}
                    </div>
                )}
            </main>

            {showModal && (
                <CreatePostModal
                    onClose={() => setShowModal(false)}
                    onCreated={handlePostCreated}
                />
            )}
        </div>
    );
}
