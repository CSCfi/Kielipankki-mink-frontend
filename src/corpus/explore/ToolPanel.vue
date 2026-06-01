<script setup lang="ts">
import { PhArrowSquareOut, PhGearFine } from "@phosphor-icons/vue";
import ActionButton from "@/components/ActionButton.vue";

defineProps<{
  name: string;
  info: string;
  canInstall?: boolean;
  isInstalled?: boolean;
  linkUrl?: string;
  linkText?: string;
}>();
defineEmits<{
  (e: "install"): void;
  (e: "view"): void;
}>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap gap-2 justify-between items-baseline">
      <h3 class="font-semibold">{{ name }}</h3>

      <div class="flex gap-2 justify-end items-baseline">
        <ActionButton
          :disabled="!canInstall"
          class="whitespace-nowrap"
          :class="{ 'button-primary': canInstall && !isInstalled }"
          @click="$emit('install')"
        >
          <PhGearFine weight="bold" class="inline mb-1 mr-1" />
          {{
            $t(
              !isInstalled
                ? "exports.tools.install"
                : "exports.tools.reinstall",
            )
          }}
        </ActionButton>

        <ActionButton
          v-if="isInstalled"
          class="button-primary"
          @click="$emit('view')"
        >
          <PhArrowSquareOut weight="bold" class="inline mb-1 mr-1" />
          {{ $t("exports.tools.view") }}
        </ActionButton>
      </div>
    </div>

    <div class="text-sm text-gray-500 dark:text-gray-400">
      <div>{{ info }}</div>
      <a v-if="linkUrl && linkText" :href="linkUrl" target="_blank">
        {{ linkText }}
      </a>
    </div>
  </div>
</template>
