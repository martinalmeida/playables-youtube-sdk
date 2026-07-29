/**
 * StateMachine.ts — FSM genérica para IA de enemigos, estados de personaje,
 * o flujo de fases dentro de una escena (ej. 'aiming' -> 'shooting' ->
 * 'cooldown'). No es específica de Phaser: cualquier objeto con estados
 * discretos puede usarla.
 *
 * Uso:
 *   const fsm = createStateMachine({
 *       initial: 'idle',
 *       states: {
 *           idle:    { onEnter: () => {...}, on: { move: 'walking' } },
 *           walking: { onEnter: () => {...}, on: { stop: 'idle', jump: 'jumping' } },
 *           jumping: { onEnter: () => {...}, on: { land: 'idle' } }
 *       }
 *   });
 *   fsm.send('move'); // idle -> walking
 *   fsm.current;       // 'walking'
 */
export interface StateDefinition<S extends string> {
    onEnter?: () => void;
    onExit?: () => void;
    on?: Partial<Record<string, S>>;
}

export interface StateMachineConfig<S extends string> {
    initial: S;
    states: Record<S, StateDefinition<S>>;
}

export interface StateMachine<S extends string> {
    readonly current: S;
    send(event: string): boolean;
    is(state: S): boolean;
}

export function createStateMachine<S extends string>({
    initial,
    states
}: StateMachineConfig<S>): StateMachine<S> {
    let current = initial;
    states[current]?.onEnter?.();

    function send(event: string): boolean {
        const next = states[current]?.on?.[event];
        if (!next) return false;

        states[current]?.onExit?.();
        current = next as S;
        states[current]?.onEnter?.();
        return true;
    }

    function is(state: S): boolean {
        return current === state;
    }

    return {
        get current() {
            return current;
        },
        send,
        is
    };
}
