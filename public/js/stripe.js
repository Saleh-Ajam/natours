import axios from 'axios';
const stripe = Stripe('pk_test_51JW8IgCwIKkanm5pjdLSAFLq9YJefZTSLafWjuPVJa70HJljYA1QcgA9R8zU5cJXF6VDjMAc6ZLFikXcyFvOBJCp008ym3pN26');
import {showAlert} from './alerts';

export const bookTour = async tourId => {
    // 1) Get checkout session from API
    try{
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);
        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });

    }catch(err) {
        console.log(err);
        showAlert('error', err);
    }

    

};