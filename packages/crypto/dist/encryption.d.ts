export declare function encryptEnvelope(payload: object): {
    payload_nonce: string;
    payload_ct: string;
    payload_tag: string;
    dek_wrap_nonce: string;
    dek_wrapped: string;
    dek_wrap_tag: string;
    alg: string;
    mk_version: number;
};
export declare function decryptEnvelope(record: any): any;
