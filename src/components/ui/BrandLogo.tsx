import React, {useEffect,useState} from 'react';
import {useSiteSettings} from '../../context/SiteSettingsContext';

export function BrandLogo({className}: {className?:string}) {
  const {settings}=useSiteSettings();
  const [dark,setDark]=useState(false);
  const [failed,setFailed]=useState('');
  useEffect(()=>{
    const media=window.matchMedia('(prefers-color-scheme: dark)');
    const root=document.documentElement;
    const update=()=>{const theme=root.getAttribute('data-theme');setDark(theme==='dark'||root.classList.contains('dark')||(!(theme==='light'||root.classList.contains('light'))&&media.matches));};
    const observer=new MutationObserver(update);observer.observe(root,{attributes:true,attributeFilter:['class','data-theme']});
    media.addEventListener('change',update);update();
    return()=>{observer.disconnect();media.removeEventListener('change',update);};
  },[]);
  const primary=settings.brand.logoUrl || '/mayf-logo.png';
  const selected=dark && settings.brand.altLogoUrl ? settings.brand.altLogoUrl : primary;
  const src=failed===selected ? '/mayf-logo.png' : selected;
  return <img src={src} alt="Maths at Your Fingertips" className={className} style={dark?{backgroundColor:'#0f172a'}:undefined} onError={()=>setFailed(selected)} />;
}
