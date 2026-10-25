import {useState,useEffect} from 'react';
import {defaultClassification,ClassificationSettings} from './classificationSettings';
export function useClassification(){
 const [settings,setSettings]=useState<ClassificationSettings>(defaultClassification);
 const [error,setError]=useState('');
 const refresh=async()=>{try{const response=await fetch('/api/content-classification',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error();const data=await response.json();setSettings(data.settings);setError('');}catch{setError('Saved options could not be loaded. Retry before adding content.');}};
 useEffect(()=>{void refresh();const listener=()=>void refresh();window.addEventListener('classification-updated',listener);return()=>window.removeEventListener('classification-updated',listener);},[]);
 return {settings,error,refresh};
}
