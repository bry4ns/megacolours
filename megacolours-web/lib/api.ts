export type PricingMode='AREA'|'FIXED'
export type Product={id:string;name:string;slug:string;category:string;description:string;active:boolean;pricingMode:PricingMode;pricePerM2:number;fixedPrice:number;minimumPrice:number;allowCustomDimensions:boolean;minWidth:number;maxWidth:number;minHeight:number;maxHeight:number;dimensionStep:number;stock:number|null;image:string|null;presets:Preset[];options:ProductOption[]}
export type Preset={id:string;name:string;width:number;height:number;fixedPrice:number|null;stock:number|null;active:boolean;image:string|null;description:string}
export type ProductOption={id:string;name:string;price:number;active:boolean}
export type DeliveryMethod={id:string;name:string;description:string;price:number;active:boolean;requiresAddress:boolean}
export type Selection={productId:string;presetId?:string;width:number;height:number;quantity:number;options:string[];deliveryMethodId:string}
export type PriceSnapshot={productName:string;presetName:string|null;width:number;height:number;quantity:number;unitPrice:number;subtotal:number;extras:number;shipping:number;total:number;currency:'CLP';rules:string[]}
export type Crop={x:number;y:number;zoom:number;rotation:0}
export async function api<T>(path:string, init?:RequestInit):Promise<T>{const res=await fetch(`/api${path}`,{...init,headers:{'Content-Type':'application/json',...(init?.headers||{})}});const body=await res.json().catch(()=>({error:'Respuesta inválida'}));if(!res.ok)throw new Error(body.error||'No fue posible completar la solicitud');return body}
export async function getCatalog(){return api<{products:Product[];deliveryMethods:DeliveryMethod[]}>('/catalog')}
export const clp=(n:number)=>new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP',maximumFractionDigits:0}).format(n)
