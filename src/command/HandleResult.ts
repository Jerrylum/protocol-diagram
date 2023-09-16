/**
 * this record that holds the information of the command handling result,
 * including the state of success and the reason of what driven to this result
 */
export class HandleResult {
    constructor (readonly success: boolean, readonly message: string | null) {}

    static readonly NOT_HANDLED = new HandleResult(false, null);
    static readonly HANDLED = new HandleResult(true, null);
    static readonly TOO_FEW_ARGUMENTS = new HandleResult(false, "Too few arguments.");
    static readonly TOO_MANY_ARGUMENTS = new HandleResult(false, "Too many arguments.");
}

/**
 * a utility function that assists to instantiate a new failed HandleResult with
 * dynamic message
 * 
 * @param message the message of the failed result
 * @return HandleResult
 */
export function fail(message:string): HandleResult {
    return new HandleResult(false, message);
}

/**
 * a utility function that assists to instantiate a new success HandleResult
 * with dynamic message
 * 
 * @param message the message of the success result
 * @return HandleResult
 */
export function success(message:string): HandleResult {
    return new HandleResult(true, message);
}
