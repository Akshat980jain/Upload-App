import React, { useState } from 'react';
import axios from 'axios';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Login.css'; /* Shares Login card styles */

const API_URL = process.env.REACT_APP_API_URL ?? 'https://gallayhub.onrender.com';

const Register = ({ onLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.post(`${API_URL}/api/users/register`, { name, email, password });
            toast.success('Account created!');
            onLogin(data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
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
                <h2>Create account</h2>
                <p>Get started with GalleryHub</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <div className="password-input">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min 6 characters"
                            required
                        />
                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                </div>

                <button type="submit" className="auth-submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #a855f7, #4285f4)' }}>
                    {loading ? <div className="btn-spinner" /> : <><UserPlus size={18} /><span>Create Account</span></>}
                </button>
            </form>
        </div>
    );
};

export default Register;