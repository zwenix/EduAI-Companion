const fs = require('fs');
let code = fs.readFileSync('src/components/SplashScreen.tsx', 'utf8');

code = code.replace(
  `  useEffect(() => {
    const timer = setTimeout(() => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    }, 5000); // Set to play/display for exactly 5 seconds

    // Try to trigger video play on mount
    const loadTimer = setTimeout(() => {
      if (!videoRef.current || videoRef.current.readyState < 3) {
        console.warn("Video taking too long to load, but we'll wait for the element's error event.");
      }
    }, 5000);

    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        console.warn("Initial autoplay attempt:", err);
      });
    }

    return () => {
      clearTimeout(loadTimer);
    };
  }, [onVideoEnd]);`,
  `  useEffect(() => {
    // We rely on the video onEnded event if possible, but add a fallback timeout just in case it doesn't play or end
    const timer = setTimeout(() => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    }, 7000); 

    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        console.warn("Initial autoplay attempt:", err);
        // If autoplay fails, we might be on mobile, just let the fallback timeout handle it
      });
    }

    return () => {
      clearTimeout(timer);
    };
  }, [onVideoEnd]);`
);

code = code.replace(
  `  const handleEnded = () => {
    // If the video ended naturally but we want to play for 10 seconds, 
    // let loop handle the visual, and let the timer handle the transition.
  };`,
  `  const handleEnded = () => {
    if (onVideoEnd) {
      onVideoEnd();
    }
  };`
);

// Remove loop attribute
code = code.replace(/loop\s*\n/, '');
// Also change onEnded to call handleEnded
code = code.replace(`autoPlay\n`, `autoPlay\nonEnded={handleEnded}\n`);

fs.writeFileSync('src/components/SplashScreen.tsx', code);
