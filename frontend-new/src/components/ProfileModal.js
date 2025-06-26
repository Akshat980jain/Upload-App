import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './ProfileModal.css';

const API_URL = 'https://gallaryhub.onrender.com';

// Helper function to create a Blob from a cropped image
function getCroppedImg(image, crop, fileName) {
  const canvas = document.createElement('canvas');
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        return;
      }
      blob.name = fileName;
      resolve(blob);
    }, 'image/jpeg');
  });
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

const ProfileModal = ({ token, closeModal, onUserInfoUpdate, userInfo, onProfileClick, onLogout }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');

  const [totalStorage, setTotalStorage] = useState(null);
  const STORAGE_LIMIT = 2 * 1024 * 1024 * 1024; // 2 GB in bytes

  const isMobile = useIsMobile();
  const defaultAvatar = '/default-avatar.png';
  const profilePictureUrl = userInfo && userInfo.profilePicture ? `${API_URL}/uploads/${userInfo.profilePicture}` : defaultAvatar;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const { data } = await axios.get('https://gallaryhub.onrender.com/api/users/profile', config);
        setUser(data);
        setName(data.name);
        setEmail(data.email);
      } catch (err) {
        setError('Failed to fetch user profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTotalStorage = async () => {
      try {
        const [docsRes, imgsRes, vidsRes] = await Promise.all([
          axios.get('https://gallaryhub.onrender.com/api/documents', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://gallaryhub.onrender.com/api/images', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('https://gallaryhub.onrender.com/api/videos', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const docSize = Array.isArray(docsRes.data) ? docsRes.data.reduce((sum, d) => sum + (d.size || 0), 0) : 0;
        const imgSize = Array.isArray(imgsRes.data) ? imgsRes.data.reduce((sum, i) => sum + (i.size || 0), 0) : 0;
        const vidSize = Array.isArray(vidsRes.data) ? vidsRes.data.reduce((sum, v) => sum + (v.size || 0), 0) : 0;
        setTotalStorage(docSize + imgSize + vidSize);
      } catch (e) {
        setTotalStorage(null);
      }
    };

    if (token) {
      fetchUserProfile();
      fetchTotalStorage();
    }
  }, [token]);

  useEffect(() => {
    if (success && closeModal) {
      const timer = setTimeout(() => {
        closeModal();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [success, closeModal]);

  function onImageLoad(e) {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1, // 1:1 aspect ratio
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handlePictureUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      setUpdateError("Please select an area to crop.");
      return;
    }

    const croppedImageBlob = await getCroppedImg(
      imgRef.current,
      completedCrop,
      'newProfilePic.jpeg'
    );
    
    const formData = new FormData();
    formData.append('profilePicture', croppedImageBlob);

    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put(`${API_URL}/api/users/profile/picture`, formData, config);
      setImgSrc(''); // Hide the cropper UI
      setSuccess('Profile picture updated!');
      
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      userInfo.profilePicture = data.profilePicture;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      if (onUserInfoUpdate) {
        onUserInfoUpdate(userInfo);
      }

    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to upload picture.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setSuccess('');

    // This function no longer handles image uploads.
    // That is now handled by the "Set Picture" button.

    if (newPassword && newPassword !== confirmPassword) {
      setUpdateError('New passwords do not match.');
      return;
    }

    const updatedUser = { name, email };
    if (newPassword && currentPassword) {
      updatedUser.currentPassword = currentPassword;
      updatedUser.newPassword = newPassword;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put('https://gallaryhub.onrender.com/api/users/profile', updatedUser, config);
      setUser(data);
      setName(data.name);
      setEmail(data.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Profile details updated successfully!');

      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      userInfo.name = data.name;
      userInfo.email = data.email;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  // Helper to format bytes
  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    } else if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else if (bytes >= 1024) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return bytes + ' B';
    }
  };

  return (
    <div className="profile-modal-backdrop" onClick={closeModal}>
      <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal" onClick={closeModal}>X</button>
        <h2>User Profile</h2>
        {/* Always show avatar at the top of the modal */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
          {isMobile ? (
            <button onClick={onProfileClick} className="profile-button" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <img src={profilePictureUrl} alt="Profile" className="profile-avatar-header" />
            </button>
          ) : (
            <img src={profilePictureUrl} alt="Profile" className="profile-avatar-header" />
          )}
        </div>
        {/* Show logout button only on mobile */}
        {isMobile && (
          <button onClick={onLogout} className="logout-button-global" style={{marginBottom: '1rem', alignSelf: 'center'}}>
            <span className="button-icon">🚪</span>
            <span className="button-text">Logout</span>
          </button>
        )}
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        {user && (
          <form onSubmit={handleUpdate}>
            {updateError && <p className="error-message">{updateError}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="profile-picture-section">
              <input type="file" id="profilePictureInput" onChange={handleFileChange} accept="image/*" />
              <label htmlFor="profilePictureInput" className="file-input-label">Choose a new photo</label>
            </div>
            
            {imgSrc && (
              <div className="crop-container">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                >
                  <img ref={imgRef} src={imgSrc} onLoad={onImageLoad} alt="Crop preview" />
                </ReactCrop>
                <button type="button" onClick={handlePictureUpload} className="crop-confirm-button">
                  OK
                </button>
              </div>
            )}

            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <hr />
            <p>Change Password</p>
            <div className="form-group">
              <label>Current Password</label>
              <input 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
            <div className="profile-storage-info" style={{marginBottom: '1rem', textAlign: 'center'}}>
              <span role="img" aria-label="storage">💾</span> <b>Total Storage Used:</b> {formatSize(totalStorage)} / {formatSize(STORAGE_LIMIT)}
              <div className="profile-storage-bar-container">
                <div className="profile-storage-bar-bg">
                  <div className="profile-storage-bar-fill" style={{width: `${Math.min(100, (totalStorage || 0) / STORAGE_LIMIT * 100)}%`}}></div>
                </div>
                <div className="profile-storage-bar-label">
                  {((totalStorage || 0) / STORAGE_LIMIT * 100).toFixed(1)}% used
                </div>
              </div>
            </div>
            <button type="submit">Update Profile</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileModal; 