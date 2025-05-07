main()
    .then(() => {
        console.log('token-new done.');
    })
    .catch((err) => {
        console.error('token-new error:', err);
    });
async function main() {
    console.log('Starting token-new...');

    const appSecret = process.argv[2];
    const text = process.argv[3];

    if (appSecret === undefined || text === undefined) {
        throw new Error('Missing arguments.');
    }

    const encryptedSecret = await encryptV2(text, appSecret);
    const encoded64EncryptedSecret = btoa(encryptedSecret);
    const urlEncoded64BaseEncryptedSecret = encodeURIComponent(encoded64EncryptedSecret);

    console.log('Result:', {
        encryptedSecret,
        encoded64EncryptedSecret,
        urlEncoded64BaseEncryptedSecret,
    });

}

// Follows Ernie Turner's implementation.
// See: https://www.youtube.com/watch?v=lbt2_M1hZeg
async function encryptV2(text: string, password: string) {
    // We are using the new Web Crypto API to encrypt and decrypt. Using the subtle crypto module, which is an interface for lower level encryption and decryption operations.
    // In order to start the encryption process, we start by defining an importing blueprint. We can't just import our secret because it is insecure to do so.

    // We call the importKey method from the module which essentially gives us a CryptoKey class that we will use to tell the process which secret we are using and how we are going to use it.
    const cryptoKey = await crypto.subtle.importKey('raw', Buffer.from(password, 'utf8'), 'PBKDF2', false, ['deriveKey']);

    // We then call deriveKey which uses the CryptoKey blueprint we defined earlier to create an AES encryption key from the secret.
    // The key is essentially made by using the original secret and then hashing it 25000 times with SHA-256 so that it would be incredibly difficult to brute-force it back to it's original form. We also use a salt here to make it even more difficult.
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const encryptionKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 25000,
            hash: {
                name: 'SHA-256',
            },
        },
        cryptoKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        false,
        ['encrypt']
    );

    // Finally we encrypt the data using the AES key that we derived from our secret. We use an IV here which is another random value to make it harder to reverse back.
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const rawEncryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        encryptionKey,
        Buffer.from(text, 'utf8')
    );

    // Final encrypted data in raw for must be transformed back into an array
    const encryptedData = new Uint8Array(rawEncryptedData);

    // We concat together the salt, iv and the data at the end and then encode into base64 for easy transport.
    // The salt and iv can be safely stored together so that we may decrypt the data back
    // The salt and iv are always the same length so we can slice the string back up into the proper form in the end.
    const packagedEncryptedData = Buffer.concat([salt, iv, encryptedData]).toString('base64');

    return packagedEncryptedData;
}

// Follows Ernie Turner's implementation.
// See: https://www.youtube.com/watch?v=lbt2_M1hZeg
// Decrypt is just the reverse of encrypt so it is pretty straightforward.
async function decryptV2(encryptedText: string, password: string) {
    // Decode the encrypted string back.
    const encryptedTextDecodedBuffer = Buffer.from(encryptedText, 'base64');

    // Slice our data back into the proper form
    const salt = encryptedTextDecodedBuffer.subarray(0, 32);
    const iv = encryptedTextDecodedBuffer.subarray(32, 44);
    const text = encryptedTextDecodedBuffer.subarray(44);

    // Same as encrypt, we need to derive our key back from our secret.
    const cryptoKey = await crypto.subtle.importKey('raw', Buffer.from(password, 'utf8'), 'PBKDF2', false, ['deriveKey']);
    const decryptionKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 25000,
            hash: {
                name: 'SHA-256',
            },
        },
        cryptoKey,
        {
            name: 'AES-GCM',
            length: 256,
        },
        false,
        ['decrypt']
    );

    // We attempt the decrypt. AES has multiple forms which is defined in the characters after the dash. The GCM form means that if the decryption fails, it will throw an error.
    const rawDecryptedData = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        decryptionKey,
        text
    );

    // The raw decrypted data is a buffer and must be cut up back into an array. And then finally into the final string representation.
    const decryptedData = new Uint8Array(rawDecryptedData);
    return Buffer.from(decryptedData.buffer).toString();
}

// Uses encryptV2 with default app secret for more convenience.
// async function encryptV2AS(text: string) {
//     return await encryptV2(text, await getAppSecret());
// }

// async function decryptV2AS(encryptedText: string) {
//     return await decryptV2(encryptedText, await getAppSecret());
// }
