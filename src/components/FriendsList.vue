<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { parse } from 'smol-toml';

interface Friend {
    key: string;
    name: string;
    url: string;
    avatar: string;
    description: string;
    rss?: string;
}

const friends = ref<Friend[]>([]);
const loading = ref(true);
const error = ref(false);
const shuffled = ref(false);

// Redirect modal
const showRedirectModal = ref(false);
const redirectFriend = ref<Friend | null>(null);


const loadingTexts = ['加载中...', '让我找找看...', '马上就好...'];
const loadingText = ref(loadingTexts[0]);
let loadingIndex = 0;
let loadingInterval: ReturnType<typeof setInterval>;

function rotateLoadingText() {
    loadingInterval = setInterval(() => {
        if (loadingIndex < loadingTexts.length - 1) {
            loadingIndex++;
            loadingText.value = loadingTexts[loadingIndex];
        }
    }, 5000);
}

onMounted(async () => {
    rotateLoadingText();

    try {
        const response = await fetch('/friends.toml');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        const data = parse(text) as Record<string, Record<string, string>>;

        for (const [key, value] of Object.entries(data)) {
            friends.value.push({
                key,
                name: value.name || key,
                url: value.url || '#',
                avatar: value.avatar || '',
                description: value.description || '',
                rss: value.rss || undefined,
            });
        }

        // Fisher-Yates shuffle — randomize order every load
        for (let i = friends.value.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [friends.value[i], friends.value[j]] = [friends.value[j], friends.value[i]];
        }
    } catch (err) {
        console.error('Failed to load friends:', err);
        error.value = true;
    } finally {
        clearInterval(loadingInterval);
        loading.value = false;
        shuffled.value = true;
    }
});

function cancelRedirect() {
    showRedirectModal.value = false;
    redirectFriend.value = null;
}

function executeRedirect(friend: Friend) {
    window.open(friend.url, '_blank', 'noopener,noreferrer');
    cancelRedirect();
}

function randomFriend() {
    if (friends.value.length === 0) return;
    const idx = Math.floor(Math.random() * friends.value.length);
    const friend = friends.value[idx];

    redirectFriend.value = friend;
    showRedirectModal.value = true;
}



function shuffle() {
    const arr = [...friends.value];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    friends.value = arr;
}

function onImgLoad(e: Event) {
    (e.target as HTMLElement).classList.add('loaded');
}
</script>

<template>
    <div v-if="loading" class="state-container">
        <p>{{ loadingText }}</p>
    </div>

    <div v-else-if="error" class="state-container">
        <p>加载友链失败，请稍后重试。</p>
    </div>

    <div v-else-if="friends.length === 0" class="state-container">
        <p>还没有友链呢，快来成为第一个吧~</p>
    </div>

    <div v-else>
        <div v-if="shuffled" class="friends-toolbar">
            <button class="btn" @click="shuffle" title="刷新一下" data-tip="重新打乱顺序">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                刷新一下
            </button>
            <button class="btn" @click="randomFriend" title="试试手气" data-tip="随机转跳一位友链">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                试试手气
            </button>
        </div>
        <TransitionGroup tag="div" class="friends-grid" name="flip">
            <div v-for="friend in friends" :key="friend.key" class="friend-card card card--hover">
                <a :href="friend.url" target="_blank" rel="noopener noreferrer" class="friend-link">
                    <img v-if="friend.avatar" :src="friend.avatar" :alt="friend.name" class="avatar" loading="lazy" @load="onImgLoad" @error="onImgLoad" />
                    <span v-else class="avatar avatar-placeholder">{{ friend.name.charAt(0) }}</span>
                    <div class="card-body">
                        <span class="name">{{ friend.name }}</span>
                        <span v-if="friend.description" class="desc line-clamp-2">{{ friend.description }}</span>
                    </div>
                </a>
                <a v-if="friend.rss" :href="friend.rss" target="_blank" rel="noopener noreferrer" class="rss-badge tooltip"
                                    data-tip="支持 RSS">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 11a9 9 0 0 1 9 9" />
                        <path d="M4 4a16 16 0 0 1 16 16" />
                        <circle cx="5" cy="19" r="1" />
                    </svg>
                </a>
            </div>
        </TransitionGroup>
    </div>

    <!-- Redirect confirmation modal -->
    <Teleport to="body">
        <Transition name="modal">
            <div v-if="showRedirectModal && redirectFriend" class="modal-overlay" @click.self="cancelRedirect">
                <div class="modal-card card">
                    <img v-if="redirectFriend.avatar" :src="redirectFriend.avatar" :alt="redirectFriend.name"
                                            class="redirect-avatar" @load="onImgLoad" @error="onImgLoad" />
                    <span v-else class="redirect-avatar redirect-avatar-placeholder">{{
                        redirectFriend.name.charAt(0) }}</span>
                    <div class="redirect-info">
                        <span class="redirect-label">即将前往</span>
                        <span class="redirect-name">{{ redirectFriend.name }}</span>
                        <span v-if="redirectFriend.description" class="redirect-desc line-clamp-2">{{ redirectFriend.description }}</span>
                    </div>

                    <div class="redirect-actions">
                        <button class="btn btn--cancel" @click="cancelRedirect">取消</button>
                        <button class="btn btn--go" @click="executeRedirect(redirectFriend)">前往</button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.state-container {
    text-align: center;
    padding: 3em 0;
    color: var(--semi-accent-color);
}

.state-container p {
    margin: 0;
    font-size: 1em;
}

.friends-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
}

.friend-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    color: inherit;
    transition:
        transform 0.3s,
        box-shadow 0.3s;
}

.friend-card:hover {
    transform: translateY(-2px);
}

.friend-link {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
    text-decoration: none;
    color: inherit;
}

.avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    filter: blur(6px);
    opacity: 0.7;
    transition: filter 0.4s ease-out, opacity 0.4s ease-out;
}

.avatar.loaded {
    filter: blur(0);
    opacity: 1;
}

.avatar-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1em;
    font-weight: 600;
    color: var(--accent-color);
    background: color-mix(in srgb, var(--accent-color) 12%, transparent);
}

.card-body {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.name {
    font-size: 0.95em;
    font-weight: 600;
    color: var(--normal-text-color);
    transition: color 0.25s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.friend-card:hover .name {
    color: var(--accent-color);
}

.desc {
    font-size: 0.8em;
    color: var(--semi-accent-color);
    line-height: 1.4;
}

.rss-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    text-decoration: none;
    color: var(--semi-accent-color);
    opacity: 0.65;
    transition: opacity 0.2s;
}

.rss-badge:hover {
    opacity: 1;
    color: var(--accent-color);
}

.friends-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 1.2em;
}

.flip-move {
    transition: transform 0.35s ease;
}

/* ===== Redirect modal (component-specific) ===== */
.redirect-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    filter: blur(6px);
    opacity: 0.7;
    transition: filter 0.4s ease-out, opacity 0.4s ease-out;
}

.redirect-avatar.loaded {
    filter: blur(0);
    opacity: 1;
}

.redirect-avatar-placeholder {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6em;
    font-weight: 600;
    color: var(--accent-color);
    background: color-mix(in srgb, var(--accent-color) 12%, transparent);
}

.redirect-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.redirect-label {
    font-size: 0.85em;
    color: var(--semi-accent-color);
}

.redirect-name {
    font-size: 1.15em;
    font-weight: 700;
    color: var(--normal-text-color);
}

.redirect-desc {
    font-size: 0.8em;
    color: var(--semi-accent-color);
}

.redirect-actions {
    display: flex;
    gap: 12px;
    margin-top: 4px;
}

.redirect-actions .btn {
    font-size: 0.9em;
    padding: 7px 22px;
    background: transparent;
    border: 1px solid var(--semi-accent-color);
    color: var(--semi-accent-color);
    box-shadow: -4px 5px 2px 1px var(--shadow-color);
    border-radius: 0;
    transition:
        color 0.2s,
        border-color 0.2s,
        box-shadow 0.3s;
}

.redirect-actions .btn:hover {
    color: var(--accent-color);
    border-color: var(--semi-accent-color);
    box-shadow: -6px 7px 2px 1px var(--shadow-color);
}

.redirect-actions .btn:active {
    box-shadow: -2px 3px 1px 1px var(--shadow-color);
}

@media (max-width: 560px) {
    .friends-grid {
        grid-template-columns: 1fr;
        gap: 10px;
    }

    .friend-card {
        padding: 12px 14px;
        gap: 10px;
    }

    .rss-badge {
        width: 22px;
        height: 22px;
        top: 1px;
        right: 1px;
        opacity: 0.55;
    }
}
</style>
