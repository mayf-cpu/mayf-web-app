import React from 'react';
/** Brand silhouettes, kept local so social links need no external icon requests. */
export function SocialIcon({name}:{name:'youtube'|'instagram'|'telegram'|'whatsapp'}){
 return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true" focusable="false">
 {name==='youtube'?<><path d="M23 7s-.2-1.7-.9-2.4C21.2 3.7 20.2 3.7 19.8 3.6 16.6 3.4 12 3.4 12 3.4S7.4 3.4 4.2 3.6C3.8 3.7 2.8 3.7 1.9 4.6 1.2 5.3 1 7 1 7S.8 9 .8 11v2c0 2 .2 4 .2 4s.2 1.7.9 2.4c.9.9 2.1.9 2.6 1 1.9.2 7.5.2 7.5.2s4.6 0 7.8-.3c.4 0 1.4-.1 2.3-1 .7-.6.9-2.3.9-2.3s.2-2 .2-4v-2C23.2 9 23 7 23 7Z"/><path d="m9.5 8 6 4-6 4Z" fill="white"/></>:null}
 {name==='instagram'?<g fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></g>:null}
 {name==='telegram'?<path d="m21.8 3.5-3.2 17c-.2 1-1 1.2-1.8.7L12 17.6l-2.3 2.2c-.3.3-.5.5-1 .5l.4-5 9.2-8.3c.4-.4-.1-.6-.6-.3L6.3 13.9l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.8 3.4c.9-.3 1.5.2 1 1Z"/>:null}
 {name==='whatsapp'?<><path fillRule="evenodd" d="M12 1a11 11 0 0 0-9.5 16.5L1 23l5.7-1.5A11 11 0 1 0 12 1Zm0 2a9 9 0 1 1-4.6 16.7l-.4-.2-3.2.9.9-3.1-.3-.5A9 9 0 0 1 12 3Z"/><path d="M8 6.8c-.4 0-1.5.7-1.5 2.2s1.1 3 1.3 3.2c.2.2 2.2 3.5 5.5 4.7 2.7 1 3.2.5 3.8-.1.6-.6 1-1.7.8-2-.2-.3-2.5-1.4-2.8-1.4-.3 0-.5.1-.7.4l-.9 1c-.2.2-.4.2-.8.1-1.7-.8-2.8-1.8-3.8-3.3-.3-.5.3-.6.7-1.4.1-.3 0-.5-.1-.7L8.6 7c-.1-.2-.3-.2-.6-.2Z"/></>:null}
 </svg>;
}
