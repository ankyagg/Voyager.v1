const fs=require('fs');
const places=JSON.parse(fs.readFileSync('c:/Users/Aniket Walanj/Desktop/Voyager/frontend/src/data/places.json','utf8'));
function wikimediaThumb(origUrl,width=400){
  try{
    const parts=origUrl.split('/commons/');
    if(parts.length<2) return origUrl;
    const filepath=parts[1];
    const basename=filepath.substring(filepath.lastIndexOf('/')+1);
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${filepath}/${width}px-${basename}`;
  } catch(e){return origUrl;}
}
places.slice(0,5).forEach(p=>console.log(p.image_url+' -> '+wikimediaThumb(p.image_url)));
