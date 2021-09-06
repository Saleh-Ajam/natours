import '@babel/polyfill';
import {displayMap} from './mapbox';
import {login, logout} from './login';
import {updateSettings} from './updateSettings';
import {bookTour} from './stripe';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// VALUES

// DELEGATION
if(mapBox){
    const locations =JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

if(loginForm)
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });

if(logOutBtn) logOutBtn.addEventListener('click', logout)

if(userDataForm) {
    userDataForm.addEventListener('submit', e=>{
        e.preventDefault();
        const form = new FormData();
        form.append('name', document.getElementById('name').value);
        form.append('email', document.getElementById('email').value);
        form.append('photo', document.getElementById('photo').files[0]);
        window.setTimeout(() => {
            location.assign('/me');
        }, 1000);
        updateSettings(form, 'data');
    });
    document.querySelector('.form__upload').onchange = function() {
        if (this.files && this.files[0]) {
          var reader = new FileReader();
          reader.onload = function(e) {
            // e.target.result is a base64-encoded url that contains the image data
            document.querySelector('.form__user-photo').setAttribute('src', e.target.result);
          };
          reader.readAsDataURL(this.files[0]);
        }
      }
}

if(userPasswordForm) userPasswordForm.addEventListener('submit', async e =>{
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent= 'Updating ...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
    document.querySelector('.btn--save-password').textContent = 'SAVE PASSWORD';

});

if(bookBtn){
    bookBtn.addEventListener('click', e=>{
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset.tourId;
        bookTour(tourId);
    })
}