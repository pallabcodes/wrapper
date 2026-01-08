
import { HttpStatus } from '@nestjs/common';

export enum ErrorCode {
    // General Errors (1xxx)
    UNKNOWN_ERROR = 'GEN_1000',
    INTERNAL_SERVER_ERROR = 'GEN_1001',
    INVALID_INPUT = 'GEN_1002',
    RESOURCE_NOT_FOUND = 'GEN_1003',
    UNAUTHORIZED_ACCESS = 'GEN_1004',
    FORBIDDEN_ACCESS = 'GEN_1005',
    SERVICE_UNAVAILABLE = 'GEN_1006',

    // User & Auth Errors (2xxx)
    USER_NOT_FOUND = 'USR_2001',
    USER_ALREADY_EXISTS = 'USR_2002',
    INVALID_CREDENTIALS = 'USR_2003',
    EMAIL_ALREADY_VERIFIED = 'USR_2004',
    INVALID_TOKEN = 'USR_2005',
    TOKEN_EXPIRED = 'USR_2006',

    // Payment Errors (3xxx)
    PAYMENT_FAILED = 'PAY_3001',
    PAYMENT_DECLINED = 'PAY_3002',
    INSUFFICIENT_FUNDS = 'PAY_3003',
    INVALID_PAYMENT_METHOD = 'PAY_3004',
    SUBSCRIPTION_NOT_FOUND = 'PAY_3005',
    REFUND_FAILED = 'PAY_3006',
    REFUND_AMOUNT_TOO_LARGE = 'PAY_3007',
    PAYMENT_NOT_REFUNDABLE = 'PAY_3008',
    DUPLICATE_PAYMENT = 'PAY_3009',
    PAYMENT_PROCESSOR_ERROR = 'PAY_3010',

    // Notification Errors (4xxx)
    NOTIFICATION_FAILED = 'NOT_4001',
    TEMPLATE_NOT_FOUND = 'NOT_4002',
    PROVIDER_ERROR = 'NOT_4003',
}

export const ErrorCodeMap: Record<ErrorCode, HttpStatus> = {
    // General
    [ErrorCode.UNKNOWN_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
    [ErrorCode.INTERNAL_SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
    [ErrorCode.INVALID_INPUT]: HttpStatus.BAD_REQUEST,
    [ErrorCode.RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,
    [ErrorCode.UNAUTHORIZED_ACCESS]: HttpStatus.UNAUTHORIZED,
    [ErrorCode.FORBIDDEN_ACCESS]: HttpStatus.FORBIDDEN,
    [ErrorCode.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,

    // User
    [ErrorCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
    [ErrorCode.USER_ALREADY_EXISTS]: HttpStatus.CONFLICT,
    [ErrorCode.INVALID_CREDENTIALS]: HttpStatus.UNAUTHORIZED,
    [ErrorCode.EMAIL_ALREADY_VERIFIED]: HttpStatus.BAD_REQUEST,
    [ErrorCode.INVALID_TOKEN]: HttpStatus.UNAUTHORIZED,
    [ErrorCode.TOKEN_EXPIRED]: HttpStatus.UNAUTHORIZED,

    // Payment
    [ErrorCode.PAYMENT_FAILED]: HttpStatus.BAD_REQUEST,
    [ErrorCode.PAYMENT_DECLINED]: HttpStatus.PAYMENT_REQUIRED,
    [ErrorCode.INSUFFICIENT_FUNDS]: HttpStatus.PAYMENT_REQUIRED,
    [ErrorCode.INVALID_PAYMENT_METHOD]: HttpStatus.BAD_REQUEST,
    [ErrorCode.SUBSCRIPTION_NOT_FOUND]: HttpStatus.NOT_FOUND,
    [ErrorCode.REFUND_FAILED]: HttpStatus.BAD_REQUEST,
    [ErrorCode.REFUND_AMOUNT_TOO_LARGE]: HttpStatus.BAD_REQUEST,
    [ErrorCode.PAYMENT_NOT_REFUNDABLE]: HttpStatus.BAD_REQUEST,
    [ErrorCode.DUPLICATE_PAYMENT]: HttpStatus.CONFLICT,
    [ErrorCode.PAYMENT_PROCESSOR_ERROR]: HttpStatus.BAD_GATEWAY,

    // Notification
    [ErrorCode.NOTIFICATION_FAILED]: HttpStatus.BAD_REQUEST,
    [ErrorCode.TEMPLATE_NOT_FOUND]: HttpStatus.NOT_FOUND,
    [ErrorCode.PROVIDER_ERROR]: HttpStatus.BAD_GATEWAY,
};

export function getHttpStatusForCode(code: ErrorCode): HttpStatus {
    return ErrorCodeMap[code] || HttpStatus.INTERNAL_SERVER_ERROR;
}
