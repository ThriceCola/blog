<template>
  <div class="progressive-image" :style="containerStyle">
    <div v-if="status === 'loading'" class="progressive-image__skeleton shimmer" />
    <div v-if="status === 'error'" class="progressive-image__error">⚠</div>
    <img
      v-show="status === 'loaded'"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :class="['progressive-image__img', { 'progressive-image__img--entering': transitioning }]"
      :style="imgStyle"
      loading="lazy"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const props = withDefaults(defineProps<{
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  /** Aspect ratio, e.g. '16/9' */
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
}>(), {
  alt: '',
  aspectRatio: 'auto',
  objectFit: 'cover',
  objectPosition: 'center',
});

type Status = 'loading' | 'loaded' | 'error';
const status = ref<Status>('loading');
const transitioning = ref(false);

const containerStyle = computed(() => ({
  aspectRatio: props.aspectRatio !== 'auto' ? props.aspectRatio : undefined,
  width: props.width ? `${props.width}px` : undefined,
  height: props.height && props.aspectRatio === 'auto' ? `${props.height}px` : undefined,
}));

const imgStyle = computed(() => ({
  objectFit: props.objectFit,
  objectPosition: props.objectPosition,
}));

function onLoad() {
  // Small delay to allow CSS transition to kick in
  requestAnimationFrame(() => {
    transitioning.value = true;
  });
  status.value = 'loaded';
}

function onError() {
  status.value = 'error';
}

onMounted(() => {
  // Check if image was already cached/loaded before mount
  const img = new Image();
  img.src = props.src;
  if (img.complete) {
    onLoad();
  }
});
</script>

<style scoped>
.progressive-image {
  position: relative;
  overflow: hidden;
  background: var(--shadow-color);
  width: 100%;
}

.progressive-image__skeleton {
  position: absolute;
  inset: 0;
}

.progressive-image__error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  color: var(--semi-accent-color);
}

.progressive-image__img {
  display: block;
  width: 100%;
  height: 100%;
  filter: blur(15px);
  transition: filter 0.5s ease-out;
}

.progressive-image__img--entering {
  filter: blur(0);
}

/* Shimmer animation */
.shimmer {
  background: linear-gradient(
    90deg,
    var(--shadow-color) 0%,
    color-mix(in srgb, var(--semi-accent-color) 30%, transparent) 50%,
    var(--shadow-color) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
