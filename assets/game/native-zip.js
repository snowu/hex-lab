/* Store-only ZIP archives: native exercise files are readable without a JS dependency. */
(function () {
  const encoder = new TextEncoder(), crcTable = Array.from({length:256}, (_,n) => { for(let i=0;i<8;i++) n=n&1?0xedb88320^(n>>>1):n>>>1; return n>>>0; });
  function crc(bytes) { let n=0xffffffff; for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0; }
  window.nativeZip = (files) => {
    const chunks=[], directory=[];let offset=0;
    const header=(size)=>{const a=new Uint8Array(size);return {a,v:new DataView(a.buffer)};};
    for(const [path,text] of Object.entries(files)) {
      if(path.startsWith('/')||path.split('/').includes('..'))throw Error('Invalid file path');
      const name=encoder.encode(path), data=encoder.encode(text), sum=crc(data), h=header(30);h.v.setUint32(0,0x04034b50,true);h.v.setUint16(4,20,true);h.v.setUint16(6,0x800,true);h.v.setUint16(12,33,true);h.v.setUint32(14,sum,true);h.v.setUint32(18,data.length,true);h.v.setUint32(22,data.length,true);h.v.setUint16(26,name.length,true);
      chunks.push(h.a,name,data);
      const d=header(46);d.v.setUint32(0,0x02014b50,true);d.v.setUint16(4,20,true);d.v.setUint16(6,20,true);d.v.setUint16(8,0x800,true);d.v.setUint16(14,33,true);d.v.setUint32(16,sum,true);d.v.setUint32(20,data.length,true);d.v.setUint32(24,data.length,true);d.v.setUint16(28,name.length,true);d.v.setUint32(42,offset,true);directory.push(d.a,name);offset+=30+name.length+data.length;
    }
    const bytes=directory.reduce((n,c)=>n+c.length,0), end=header(22);end.v.setUint32(0,0x06054b50,true);end.v.setUint16(8,Object.keys(files).length,true);end.v.setUint16(10,Object.keys(files).length,true);end.v.setUint32(12,bytes,true);end.v.setUint32(16,offset,true);return new Blob([...chunks,...directory,end.a],{type:'application/zip'});
  };
})();
