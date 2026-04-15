$(document).ready(function() {
    // Fonctions de gestion de la sidebar
    function initSidebar() {
        if ($(window).width() >= 992) {
            $('.sidebar').addClass('active');
        } else {
            $('.sidebar').removeClass('active');
        }
    }

    function openSidebar() {
        $('.sidebar').addClass('active');
        $('.sidebar-overlay').fadeIn();
        $('body').css('overflow', 'hidden');
    }

    function closeSidebar() {
        $('.sidebar').removeClass('active');
        $('.sidebar-overlay').fadeOut();
        $('body').css('overflow', 'auto');
    }

    function toggleSidebar() {
        if ($('.sidebar').hasClass('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    // Initialisation
    initSidebar();

    // Événements
    $('#sidebarToggle').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleSidebar();
    });

    $('.sidebar-overlay').click(function(e) {
        if ($(this).is(':visible')) {
            closeSidebar();
        }
    });

    $('#sidebarClose').click(function(e) {
        e.preventDefault();
        closeSidebar();
    });

    $('.sidebar-menu a').click(function() {
        if ($(window).width() < 992) {
            closeSidebar();
        }
    });

    $(window).resize(function() {
        initSidebar();
        
        if ($(window).width() >= 992) {
            closeSidebar();
        }
    });
});
$(document).ready(function() {
    // Handle window resize
    function handleResize() {
        if ($(window).width() < 992) {
            // Mobile adjustments
            $('.chart-section canvas').each(function() {
                $(this).attr('height', '250');
            });
        } else {
            // Desktop adjustments
            $('.chart-section canvas').each(function() {
                $(this).attr('height', '');
            });
        }
    }

    // Initial call
    handleResize();

    // Bind resize event
    $(window).resize(function() {
        handleResize();
    });

    // Sidebar toggle for mobile
    $('#sidebarToggle').click(function() {
        if ($(window).width() < 992) {
            $('body').toggleClass('sidebar-open');
            $('.analytics-container').toggleClass('sidebar-pushed');
        }
    });
});