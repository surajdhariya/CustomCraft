let slider = document.querySelector('.slider .list');
let items = document.querySelectorAll('.slider .list .item');
let next = document.getElementById('next');
let prev = document.getElementById('prev');
let dots = document.querySelectorAll('.slider .dots li');

let lengthItems = items.length - 1;
let active = 0;
next.onclick = function(){
    active = active + 1 <= lengthItems ? active + 1 : 0;
    reloadSlider();
}
prev.onclick = function(){
    active = active - 1 >= 0 ? active - 1 : lengthItems;
    reloadSlider();
}
let refreshInterval = setInterval(()=> {next.click()}, 5000);
function reloadSlider(){
    slider.style.left = -items[active].offsetLeft + 'px';
    // 
    let last_active_dot = document.querySelector('.slider .dots li.active');
    last_active_dot.classList.remove('active');
    dots[active].classList.add('active');

    clearInterval(refreshInterval);
    refreshInterval = setInterval(()=> {next.click()}, 3000);

    
}

dots.forEach((li, key) => {
    li.addEventListener('click', ()=>{
         active = key;
         reloadSlider();
    })
})
window.onresize = function(event) {
    reloadSlider();
};





// prebuild proudcts
function scrollLeft() {
    var container = document.getElementById('scroll-container');
    // Get the current scroll position
    var currentScroll = container.scrollLeft;
    // Get the scroll width of the container
    var scrollWidth = container.scrollWidth;
    // Get the visible width of the container
    var clientWidth = container.clientWidth;

    if (currentScroll <= 0) {
        // If already at the leftmost, scroll to the rightmost
        container.scrollLeft = scrollWidth;
    } else {
        // Otherwise scroll left by 200px
        container.scrollLeft -= 200;
    }
}

function scrollRight() {
    var container = document.getElementById('scroll-container');
    // Get the current scroll position
    var currentScroll = container.scrollLeft;
    // Get the scroll width of the container
    var scrollWidth = container.scrollWidth;
    // Get the visible width of the container
    var clientWidth = container.clientWidth;

    if (currentScroll + clientWidth >= scrollWidth) {
        // If at the rightmost, scroll to the leftmost
        container.scrollLeft = 0;
    } else {
        // Otherwise scroll right by 200px
        container.scrollLeft += 200;
    }
}



// scroll Animation
// document.addEventListener("DOMContentLoaded", function () {
//     function revealElements() {
//         let reveals = document.querySelectorAll(".reveal");
//         reveals.forEach(function (element) {
//             let windowHeight = window.innerHeight;
//             let elementTop = element.getBoundingClientRect().top;
//             let threshold = 150; // Adjust for when the effect starts

//             if (elementTop < windowHeight - threshold) {
//                 element.classList.add("active");
//             }
//         });
//     }

//     window.addEventListener("scroll", revealElements);
//     revealElements(); // Run once to check if elements are already in view
// });

// scroll Animation