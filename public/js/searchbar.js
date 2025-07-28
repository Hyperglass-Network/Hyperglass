const searchInput = document.getElementById('uv-address');

searchInput.addEventListener('input', function() {
    const inputLength = this.value.length;
    this.classList.remove('expanding', 'expanded');
    
    if (inputLength > 15) {
        this.classList.add('expanded');
    } else if (inputLength > 8) {
        this.classList.add('expanding');
    }
});

searchInput.addEventListener('focus', function() {
    this.classList.add('expanding');
});

searchInput.addEventListener('blur', function() {
    if (this.value.length === 0) {
        this.classList.remove('expanding', 'expanded');
    }
});