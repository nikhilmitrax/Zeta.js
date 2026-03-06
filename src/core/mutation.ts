import { batch as signalBatch } from './signal';

type MutationEffect = () => void;
type MutationEffectPriority = 'high' | 'normal';

const pendingHighPriorityEffects = new Set<MutationEffect>();
const pendingNormalPriorityEffects = new Set<MutationEffect>();

let mutationBatchDepth = 0;
let isFlushingMutationEffects = false;

const MAX_SETTLE_PASSES = 1000;

function queueForPriority(priority: MutationEffectPriority): Set<MutationEffect> {
    return priority === 'high' ? pendingHighPriorityEffects : pendingNormalPriorityEffects;
}

function runQueuedEffects(queue: Set<MutationEffect>): void {
    if (queue.size === 0) return;

    const effects = [...queue];
    queue.clear();

    signalBatch(() => {
        for (const effect of effects) {
            effect();
        }
    });
}

export function queueMutationEffect(
    effect: MutationEffect,
    priority: MutationEffectPriority = 'normal',
): void {
    queueForPriority(priority).add(effect);
}

export function flushMutationEffects(): void {
    if (isFlushingMutationEffects) return;

    isFlushingMutationEffects = true;
    try {
        for (let pass = 0; pass < MAX_SETTLE_PASSES; pass++) {
            if (pendingHighPriorityEffects.size === 0 && pendingNormalPriorityEffects.size === 0) {
                return;
            }

            while (pendingHighPriorityEffects.size > 0) {
                runQueuedEffects(pendingHighPriorityEffects);
            }

            if (pendingNormalPriorityEffects.size > 0) {
                runQueuedEffects(pendingNormalPriorityEffects);
            }
        }

        throw new Error('Zeta: batched layout/constraint updates did not settle.');
    } finally {
        isFlushingMutationEffects = false;
    }
}

export function isBatchingSceneMutations(): boolean {
    return mutationBatchDepth > 0 || isFlushingMutationEffects;
}

export function batchSceneMutations<T>(fn: () => T): T {
    mutationBatchDepth++;
    try {
        let result!: T;
        signalBatch(() => {
            result = fn();
        });
        return result;
    } finally {
        mutationBatchDepth--;
        if (mutationBatchDepth === 0) {
            flushMutationEffects();
        }
    }
}
