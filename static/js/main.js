window.onload = function() {
    fetchAndDisplayDoodles(); // Fetch initial doodles on page load

    const socket = io(); // Initialize Socket.IO connection

    socket.on('connect', function() {
        console.log('Socket connected');
    });

    socket.on('disconnect', function() {
        console.log('Socket disconnected');
    });

    socket.on('connect_error', function(error) {
        console.error('Socket connection error:', error);
    });

    socket.on('new_doodle', function(data) {
        console.log('New doodle received:', data);
        displayFullScreenImage(data.image); // Display full-screen image
        setTimeout(() => {
            addNewDoodle(data.image); // Add new doodle to the grid after animation
        }, 1000); // Adjust delay as needed
    });

    function fetchAndDisplayDoodles() {
        fetch('/get_latest_doodles')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch doodles');
                }
                return response.json();
            })
            .then(data => {
                console.log('Initial doodles:', data.doodles);
                data.doodles.slice(0, 8).forEach((doodle, index) => {
                    addNewDoodle(doodle, index * 0.5);
                });

                observeVisibleImages(); // Start observing visible images
            })
            .catch(error => {
                console.error('Error fetching doodles:', error);
            });
    }

    function addNewDoodle(imageSrc, delay = 0) {
        const img = new Image();
        img.src = imageSrc;
        img.alt = 'Doodle';
        img.classList.add('animated-image');
        img.style.animationDelay = `${delay}s`; // Apply staggered animation delay

        doodleDisplay.insertBefore(img, doodleDisplay.firstChild);

        // Apply IntersectionObserver to the new image
        observeSingleImage(img);
    }

    function observeVisibleImages() {
        // Apply IntersectionObserver to trigger animation when images are in viewport
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('#doodleDisplay img').forEach(img => {
            observer.observe(img);
        });
    }

    function observeSingleImage(img) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(img);
    }

    function displayFullScreenImage(imageSrc) {
        const fullScreenContainer = document.getElementById('fullScreenContainer');
        const fullScreenImage = document.getElementById('fullScreenImage');

        fullScreenImage.src = imageSrc;
        fullScreenContainer.classList.add('show');

        setTimeout(() => {
            fullScreenContainer.classList.remove('show');
        }, 2000); // Adjust duration of full-screen display
    }
};