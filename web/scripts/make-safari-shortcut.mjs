import {mkdir,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {safariShareSource} from '../src/safari-share.mjs';
export function makeSafariShortcut(destination){
 const jsID=randomUUID().toUpperCase();
 const variable=value=>({Value:value,WFSerializationType:'WFTextTokenAttachment'});
 return {WFWorkflowName:'Save to Tofu',WFWorkflowClientVersion:'2600',WFWorkflowMinimumClientVersion:900,WFWorkflowMinimumClientVersionString:'900',WFWorkflowHasShortcutInputVariables:true,WFWorkflowIcon:{WFWorkflowIconStartColor:0x38755fff,WFWorkflowIconGlyphNumber:59511},WFWorkflowTypes:['ActionExtension'],WFWorkflowInputContentItemClasses:['WFSafariWebPageContentItem'],WFWorkflowImportQuestions:[],WFWorkflowActions:[
  {WFWorkflowActionIdentifier:'is.workflow.actions.comment',WFWorkflowActionParameters:{WFCommentActionText:'In Safari, open the full Xiaohongshu post, then Share → Save to Tofu. Reads only post title, source and image addresses. Does not read cookies or save images until you confirm in Tofu. Login and full-page image availability may be required.'}},
  {WFWorkflowActionIdentifier:'is.workflow.actions.runjavascriptonwebpage',WFWorkflowActionParameters:{UUID:jsID,WFJavaScript:safariShareSource(destination),WFInput:variable({Type:'ExtensionInput'})}},
  {WFWorkflowActionIdentifier:'is.workflow.actions.openurl',WFWorkflowActionParameters:{WFInput:variable({Type:'ActionOutput',OutputUUID:jsID,OutputName:'JavaScript Result'})}}
 ]};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
 const destination=process.env.TOFU_SITE_URL,output=process.argv[2];
 if(!destination||!output)throw Error('Set TOFU_SITE_URL and supply an output JSON path. Build artifacts belong in ignored work/outputs.');
 await mkdir(new URL('.',new URL('file://'+output)),{recursive:true});await writeFile(output,JSON.stringify(makeSafariShortcut(destination),null,2));console.log('Shortcut source generated (no account or platform credentials).');
}
