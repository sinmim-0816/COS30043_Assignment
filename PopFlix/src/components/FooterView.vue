<script setup>
import Phone from 'lucide-vue-next/dist/esm/icons/phone';
import Mail from 'lucide-vue-next/dist/esm/icons/mail';
import Facebook from 'lucide-vue-next/dist/esm/icons/facebook';
import Twitter from 'lucide-vue-next/dist/esm/icons/twitter';
import Instagram from 'lucide-vue-next/dist/esm/icons/instagram';
import Linkedin from 'lucide-vue-next/dist/esm/icons/linkedin';
import logo from '@/assets/popflix_logo.png';
</script>

<template>
    <footer class="footer-wrapper">
        <v-container fluid width="100vw">
            <v-row class="footer-top py-10">
                <v-col cols="12" md="3">
                    <img :src="logo" alt="PopFlix Logo" class="footer-logo mb-2" />
                    <p class="text-grey-darken-1 mb-4">Your ultimate destination for movie tickets and the latest cinema
                        experiences. Book now and enjoy the show.</p>
                    <div class="social-icons d-flex gap-3">
                        <Facebook size="20" />
                        <Twitter size="20" />
                        <Instagram size="20" />
                        <Linkedin size="20" />
                    </div>
                </v-col>

                <v-col cols="6" md="2">
                    <p class="fw-bold">Company</p>
                    <ul class="footer-links">
                        <li><router-link to="/movies">Movies</router-link></li>
                        <li><router-link to="/theaters">Theaters</router-link></li>
                        <li><router-link to="/showtimes">Showtimes</router-link></li>
                    </ul>
                </v-col>

                <v-col cols="6" md="2">
                    <p class="fw-bold">Support</p>
                    <ul class="footer-links">
                        <li><router-link to="/faq">Help Center</router-link></li>
                        <li><router-link to="/contact">Contact Us</router-link></li>
                        <li><router-link to="/feedback">Feedback</router-link></li>
                    </ul>
                </v-col>

                <v-col cols="6" md="2">
                    <p class="fw-bold">Links</p>
                    <ul class="footer-links">
                        <li><router-link to="/profile">My Profile</router-link></li>
                        <li><router-link to="/tickets">My Tickets</router-link></li>
                        <li><router-link to="/privacy">Privacy Policy</router-link></li>
                    </ul>
                </v-col>

                <v-col cols="6" md="3">
                    <p class="fw-bold">Contact Us</p>
                    <div class="contact-item">
                        <Phone size="16" class="me-2" /> +60 123 456 789
                    </div>
                    <div class="contact-item">
                        <Mail size="16" class="me-2" /> support@popflix.com
                    </div>
                </v-col>
            </v-row>

            <v-divider></v-divider>

            <v-row class="footer-bottom align-center">
                <v-col cols="12" md="6">&copy; 2026 PopFlix. All rights reserved.</v-col>
                <v-col cols="12" md="6" class="d-flex justify-md-end gap-4">
                    <router-link to="/privacy">Privacy Policy</router-link>
                    <router-link to="/terms">Terms of Use</router-link>
                    <router-link to="/sitemap">Site Map</router-link>
                </v-col>
            </v-row>
        </v-container>
    </footer>
</template>

<style scoped>
.footer-wrapper {
    background: var(--bg-color);
    color: var(--text-color);
    border-top: 1px solid rgba(128, 128, 128, 0.2);
    padding:0 4rem ;
}


.footer-logo {
    height: 40px;
}

h4 {
    font-weight: 700;
    margin-bottom: 1rem;
}

.footer-links {
    list-style: none;
    padding: 0;
}

.footer-links li {
    margin-bottom: 0.5rem;
}

.footer-links a {
    color: var(--text-color);
    text-decoration: none;
    opacity: 0.7;
}

.footer-links a:hover {
    opacity: 1;
    color: #ff5252;
}

.contact-item {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    opacity: 0.7;
}
</style>