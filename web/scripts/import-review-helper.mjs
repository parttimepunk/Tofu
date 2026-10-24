export async function approveImports(page){
 while(await page.getByText('Review Import',{exact:true}).isVisible()){
  const progress=await page.locator('dialog small').filter({hasText:/^Item \d+ of/}).first().innerText();
  await page.getByRole('button',{name:/^(Save & Next|Save to Library|Save Original)$/}).click();
  await page.waitForFunction(previous=>{const d=document.querySelector('dialog');return !d||!d.open||!d.textContent.includes(previous);},progress);
 }
}
