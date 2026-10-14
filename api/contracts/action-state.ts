/** Shared form response contracts; implementations live in api/actions. */
export type ActionState = { success?: boolean; message?: string; errors?: Record<string, string[]> };
export type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;
