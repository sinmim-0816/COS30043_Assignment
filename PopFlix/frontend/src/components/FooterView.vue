<script setup>
import { computed } from 'vue';
import { Facebook, Twitter, Instagram, MessageCircle } from 'lucide-vue-next';
import Ticket from 'lucide-vue-next/dist/esm/icons/ticket';
import Clapperboard from 'lucide-vue-next/dist/esm/icons/clapperboard';
import MapPinned from 'lucide-vue-next/dist/esm/icons/map-pinned';
import logo from '@/assets/popflix_logo.png';
import { useAppI18n } from '../utils/i18n';

const { t } = useAppI18n();

const exploreLinks = computed(() => [
  { label: t('topbar.movies'), to: '/movies' },
  { label: t('topbar.showtimes'), to: '/showtimes' },
  { label: t('topbar.cinemas'), to: '/theaters' },
  { label: t('topbar.customization'), to: '/customize-list' },
]);

const accountLinks = computed(() => [
  { label: t('topbar.viewProfile'), to: '/profile' },
  { label: t('topbar.myBookings'), to: '/my-tickets' },
  { label: t('topbar.notifications'), to: '/notification' },
]);

const supportLinks = computed(() => [
  { label: t('footer.helpCenter'), to: '/theaters?category=Booking&faqId=1' },
  { label: 'support@popflix.com', href: 'mailto:support@popflix.com' },
  { label: '+60 123 456 789', href: 'tel:+60123456789' },
]);
</script>

<template>
    <footer class="footer-wrapper">
        <v-container class="footer-shell" fluid>
            <div class="footer-top">
                <section class="footer-brand-card">
                    <div class="brand-lockup">
                        <img :src="logo" alt="PopFlix Logo" class="footer-logo" />
                    </div>
                    <p class="footer-description">
                        {{ t('footer.description') }}
                    </p>
                    <div class="social-icons">
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                            <Facebook size="18" />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                            <Twitter size="18" />
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                            <Instagram size="18" />
                        </a>
                        <a href="https://whatsapp.com" target="_blank" rel="noreferrer" aria-label="WhatsApp">
                            <MessageCircle size="18" />
                        </a>
                    </div>
                </section>

                <section class="footer-nav-card">
                    <p class="footer-title">
                        <Clapperboard size="16" class="me-2" />
                        {{ t('footer.explore') }}
                    </p>
                    <ul class="footer-links">
                        <li v-for="link in exploreLinks" :key="link.to">
                            <router-link :to="link.to">{{ link.label }}</router-link>
                        </li>
                    </ul>
                </section>

                <section class="footer-nav-card">
                    <p class="footer-title">
                        <Ticket size="16" class="me-2" />
                        {{ t('footer.account') }}
                    </p>
                    <ul class="footer-links">
                        <li v-for="link in accountLinks" :key="link.to">
                            <router-link :to="link.to">{{ link.label }}</router-link>
                        </li>
                    </ul>
                </section>

                <section class="footer-nav-card">
                    <p class="footer-title">
                        <MapPinned size="16" class="me-2" />
                        {{ t('footer.support') }}
                    </p>
                    <ul class="footer-links">
                        <li v-for="link in supportLinks" :key="link.label">
                            <router-link v-if="link.to" :to="link.to">{{ link.label }}</router-link>
                            <a v-else :href="link.href">{{ link.label }}</a>
                        </li>
                    </ul>
                </section>
            </div>

            <div class="footer-bottom">
                <span>{{ t('footer.copyright') }}</span>
                <div class="footer-bottom-links">
                    <span>{{ t('footer.builtForMovieLovers') }}</span>
                    <span class="footer-dot"></span>
                    <span>{{ t('footer.fastBooking') }}</span>
                    <span class="footer-dot"></span>
                    <span>{{ t('footer.easyCustomization') }}</span>
                </div>
            </div>
        </v-container>
    </footer>
</template>

<style scoped>
.footer-wrapper {
    position: relative;
    overflow: hidden;
    background: var(--footer-bg);
    color: var(--footer-text);
    border-top: 1px solid var(--footer-border);
}

.footer-shell {
    max-width: 1320px;
    margin: 0 auto;
    padding: 56px 28px 28px;
}

.footer-top {
    display: grid;
    grid-template-columns: 1.5fr repeat(3, minmax(0, 1fr));
    gap: 24px;
    align-items: start;
}

.footer-brand-card,
.footer-nav-card {
    min-width: 0;
}

.footer-brand-card {
    padding-right: 24px;
}

.brand-lockup {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
}

.footer-logo {
    width: 140px;
    height: auto;
}

.footer-description {
    max-width: 360px;
    margin: 0 0 18px;
    color: var(--footer-muted);
    line-height: 1.8;
}

.social-icons {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.social-icons a {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--footer-social-bg);
    color: var(--footer-text);
    transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.social-icons a:hover {
    transform: translateY(-2px);
    background: var(--footer-social-hover-bg);
    color: var(--footer-social-hover-text);
}

.footer-title {
    display: flex;
    align-items: center;
    margin: 0 0 16px;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--footer-text);
}

.footer-links {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
}

.footer-links a {
    color: var(--footer-link);
    text-decoration: none;
    transition: color 0.2s ease, padding-left 0.2s ease;
}

.footer-links a:hover {
    color: var(--footer-link-hover);
    padding-left: 4px;
}

.footer-bottom {
    margin-top: 28px;
    padding-top: 18px;
    border-top: 1px solid var(--footer-divider);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    color: var(--footer-muted);
    font-size: 0.9rem;
}

.footer-bottom-links {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.footer-dot {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: var(--footer-dot);
}

@media (max-width: 1024px) {
    .footer-top {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .footer-brand-card {
        grid-column: 1 / -1;
        padding-right: 0;
    }
}

@media (max-width: 640px) {
    .footer-shell {
        padding: 40px 16px 20px;
    }

    .footer-top {
        grid-template-columns: 1fr;
        gap: 28px;
    }

    .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
    }

    .footer-bottom-links {
        justify-content: flex-start;
    }
}
</style>
