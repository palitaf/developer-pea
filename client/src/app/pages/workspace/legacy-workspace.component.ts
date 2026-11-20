import {AfterViewInit,Component,OnDestroy} from '@angular/core';
import {AuthService} from '../../core/auth.service';
import {LegacyWorkflowService} from '../../core/legacy-workflow.service';
import {DocumentTemplatesComponent} from '../../shared/documents/document-templates.component';
import {ConfirmOrderModalComponent} from '../../shared/dialogs/confirm-order-modal.component';
@Component({selector:'app-legacy-workspace',standalone:true,imports:[DocumentTemplatesComponent,ConfirmOrderModalComponent],templateUrl:'./legacy-workspace.component.html'})
export class LegacyWorkspaceComponent implements AfterViewInit,OnDestroy{
 private cleanupTimer?:number; constructor(private auth:AuthService,private legacy:LegacyWorkflowService){}
 ngAfterViewInit(){const role=this.auth.user()?.role||'requester';this.legacy.initialize(role);this.applyRoleAccess(role);}
 private applyRoleAccess(role:string){
  const adminOnly=['toggleSystemBtn','tabAddItemBtn','deleteSelectedBtn'];
  if(role!=='admin')adminOnly.forEach(id=>document.getElementById(id)?.classList.add('hidden'));
  if(!['admin','manager'].includes(role)){['adminOpenButton','tabOrdersBtn','tabAddItemBtn','toggleSystemBtn','deleteSelectedBtn'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));}
  if(role==='requester'){['compareOpenButton','printSummaryButton'].forEach(id=>document.getElementById(id)?.classList.add('hidden'));}
 }
 ngOnDestroy(){document.body.classList.remove('printing-summary','printing-pea','printing-over10k-1','printing-over10k-2','printing-over10k-3','printing-over10k-4');}
}
