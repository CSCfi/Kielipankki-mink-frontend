<script setup lang="ts">
import LoginButton from "@/auth/LoginButton.vue";
import LayoutSection from "@/components/LayoutSection.vue";
import PageTitle from "@/components/PageTitle.vue";
</script>

<template>
  <div>
    <PageTitle>{{ $t("signup") }}</PageTitle>
    <div class="flex flex-wrap gap-6">
      <LayoutSection
        class="mt-0! w-64 grow"
        :title="$t('signup.existing.title')"
      >
        <p>
          {{ $t("signup.existing.login") }}
        </p>
        <LoginButton />
        <p>
          {{ $t("signup.existing.tip") }}
        </p>
      </LayoutSection>

    </div>
  </div>
</template>
