import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css';

const API_URL = process.env.REACT_APP_API_URL ?? 'https://galleryhub.onrender.com';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`${API_URL}/api/users/login`, { email, password });
            toast.success('Welcome back!');
            onLogin(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-card animate-slide-up">
            <div className="auth-header">
                <div className="auth-logo">
                    <img src="/favicon.png" alt="GalleryHub Logo" className="auth-logo-icon" style={{ borderRadius: '12px', objectFit: 'cover', width: '100%', height: '100%' }} />
                </div>
                <h2>Welcome back</h2>
                <p>Sign in to your GalleryHub account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <div className="password-input">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? (
                        <div className="btn-spinner" />
                    ) : (
                        <>
                            <LogIn size={18} />
                            <span>Sign in</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default Login;