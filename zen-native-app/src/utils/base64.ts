// Base64 encoding utility for React Native
export const base64Encode = (str: string): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  let i = 0
  
  while (i < str.length) {
    const a = str.charCodeAt(i++)
    const b = i < str.length ? str.charCodeAt(i++) : 0
    const c = i < str.length ? str.charCodeAt(i++) : 0
    
    const bitmap = (a << 16) | (b << 8) | c
    
    result += chars.charAt((bitmap >> 18) & 63)
    result += chars.charAt((bitmap >> 12) & 63)
    result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '='
    result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '='
  }
  
  return result
}