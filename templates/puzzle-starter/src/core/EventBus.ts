/**
 * EventBus.ts — pub/sub central para desacoplar sistemas (input, audio, UI,
 * gameplay). No reemplaza `this.registry` de Phaser (estado), es para
 * eventos puntuales.
 */
type Handler<T = unknown> = (detail: T) => void;

class EventBusImpl extends EventTarget {
    private handlers = new Map<Handler, EventListener>();

    on<T = unknown>(eventName: string, handler: Handler<T>): Handler<T> {
        const wrapped = ((e: Event) => handler((e as CustomEvent<T>).detail)) as EventListener;
        this.handlers.set(handler as Handler, wrapped);
        this.addEventListener(eventName, wrapped);
        return handler;
    }

    once<T = unknown>(eventName: string, handler: Handler<T>): Handler<T> {
        const wrapped = ((e: Event) => {
            handler((e as CustomEvent<T>).detail);
            this.removeEventListener(eventName, wrapped);
        }) as EventListener;
        this.addEventListener(eventName, wrapped);
        return handler;
    }

    off<T = unknown>(eventName: string, handler: Handler<T>): void {
        const wrapped = this.handlers.get(handler as Handler);
        if (wrapped) {
            this.removeEventListener(eventName, wrapped);
            this.handlers.delete(handler as Handler);
        }
    }

    emit<T = unknown>(eventName: string, detail?: T): void {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

export const EventBus = new EventBusImpl();
export default EventBus;
