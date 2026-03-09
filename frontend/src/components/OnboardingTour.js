import React, { useState, useEffect } from 'react';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';

const OnboardingTour = ({ enabled, onComplete }) => {
    const [tourEnabled, setTourEnabled] = useState(false);

    useEffect(() => {
        // Only trigger if specifically enabled via prop, AND not marked completed in local storage
        const hasCompletedTour = localStorage.getItem('onboardingCompleted');
        if (enabled && !hasCompletedTour) {
            // Slight delay to ensure elements are rendered
            const timer = setTimeout(() => {
                setTourEnabled(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [enabled]);

    const handleExit = () => {
        setTourEnabled(false);
        localStorage.setItem('onboardingCompleted', 'true');
        if (onComplete) onComplete();
    };

    const steps = [
        {
            element: '.logo',
            intro: 'Welcome to GalleryHub! Let me show you around your new workspace.',
            position: 'bottom',
        },
        {
            element: '.upload-btn', // Assuming there's a button with this class in Header or BottomDock
            intro: 'Click here to start uploading your photos, videos, or documents.',
            position: 'bottom',
        },
        {
            element: '.nav-item[title="Gallery"]',
            intro: 'All your media files organized in one place.',
            position: 'top',
        },
        {
            element: '.nav-item[title="Folders"]',
            intro: 'Create folders to organize your files and share them with the team.',
            position: 'top',
        },
        {
            element: '.activity-feed-container',
            intro: 'Keep track of recent changes, uploads, and shared files right here.',
            position: 'left',
        },
        {
            element: '.profile-avatar',
            intro: 'Access your settings, change themes, or update your profile from here.',
            position: 'bottom-right',
        }
    ];

    return (
        <Steps
            enabled={tourEnabled}
            steps={steps}
            initialStep={0}
            onExit={handleExit}
            options={{
                showProgress: true,
                showStepNumbers: false,
                exitOnOverlayClick: false,
                doneLabel: 'Got it!',
            }}
        />
    );
};

export default OnboardingTour;
