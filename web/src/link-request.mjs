// Keep sign-in transport failures distinct from inaccessible platform posts.
export async function linkRequest(body,{cloud,fetcher=fetch,signal}={}){
 if(!cloud)throw Error('Cloud sign-in is required for link image imports.');
 let session;
 try{const result=await cloud.auth.getSession();if(result.error)throw result.error;session=result.data?.session;}catch{throw Error('Could not check your Tofu sign-in. Check your connection and try again.');}
 if(!session)throw Error('Sign in first, then try importing the link.');
 let r;
 try{r=await fetcher('/api/import-link',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body),signal});}catch(e){if(e.name==='AbortError')throw e;throw Error('Could not reach the Tofu link importer. Check your connection and try again.');}
 if(!r.ok){const data=await r.json().catch(()=>({}));const error=Error(data.error||'The link importer is unavailable. Please try again.');error.collectFromPage=data.code==='POST_UNAVAILABLE'||data.code==='IMAGE_UNAVAILABLE';throw error;}
 return r;
}
