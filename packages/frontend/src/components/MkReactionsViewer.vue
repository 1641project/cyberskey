<template>
<Transition :name="$store.state.animation ? 'y' : ''">
	<TransitionGroup v-if="Object.keys(note.reactions).length > 0" :name="$store.state.animation ? 'x' : ''" tag="div" class="tdflqwzn" :class="{ isMe }">
		<XReaction v-for="(count, reaction) in note.reactions" :key="reaction" :reaction="reaction" :count="count" :is-initial="initialReactions.has(reaction)" :note="note"/>
	</TransitionGroup>
</Transition>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as misskey from 'misskey-js';
import { $i } from '@/account';
import XReaction from '@/components/MkReactionsViewer.reaction.vue';

const props = defineProps<{
	note: misskey.entities.Note;
}>();

const initialReactions = new Set(Object.keys(props.note.reactions));

const isMe = computed(() => $i && $i.id === props.note.userId);
</script>

<style lang="scss" scoped>
.y-enter-active, .y-leave-active {
	overflow: clip;
	max-height: 36px;
	transition: opacity 0.2s cubic-bezier(0,.5,.5,1), max-height 0.2s cubic-bezier(0,.5,.5,1) !important;
}
.y-enter-from, .y-leave-to {
	max-height: 0px;
	opacity: 0;
}

.x-move, .x-enter-active, .x-leave-active {
	transition: opacity 0.2s cubic-bezier(0,.5,.5,1), transform 0.2s cubic-bezier(0,.5,.5,1) !important;
}
.x-enter-from, .x-leave-to {
	opacity: 0;
	transform: scale(0.7);
}
.x-leave-active {
  position: absolute;
}

.tdflqwzn {
	margin: 4px -2px 0 -2px;

	&:empty {
		display: none;
	}

	&.isMe {
		> span {
			cursor: default !important;
		}
	}
}
</style>