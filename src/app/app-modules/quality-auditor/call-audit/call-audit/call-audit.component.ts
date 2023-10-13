/* 
* AMRIT – Accessible Medical Records via Integrated Technology 
* Integrated EHR (Electronic Health Records) Solution 
*
* Copyright (C) "Piramal Swasthya Management and Research Institute" 
*
* This file is part of AMRIT.
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this program.  If not, see https://www.gnu.org/licenses/.
*/


import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { endOfMonth, startOfMonth } from 'date-fns';
import addMonths from 'date-fns/addMonths';
import { ConfirmationService } from 'src/app/app-modules/services/confirmation/confirmation.service';
import { MasterService } from 'src/app/app-modules/services/masterService/master.service';
import { QualityAuditorService } from 'src/app/app-modules/services/quality-auditor/quality-auditor.service';
import { SetLanguageService } from 'src/app/app-modules/services/set-language/set-language.service';
import { CallRatingComponent } from '../../call-rating/call-rating.component';
import { ViewCasesheetComponent } from '../../view-casesheet/view-casesheet.component';
import * as moment from 'moment';
import { tr } from 'date-fns/locale';

@Component({
  selector: 'app-call-audit',
  templateUrl: './call-audit.component.html',
  styleUrls: ['./call-audit.component.css']
})
export class CallAuditComponent implements OnInit {
  currentLanguageSet: any;
  selectedRoute: any;
  roles: any = [];
  choice = ["Cycle Wise ", "Date Wise"];
 option : any;
 selectedRadioButtonChange: boolean = false;
 dateWiseChangeForm: boolean = false;
 iscycleWiseChangeForm: boolean = true;
  languages: any = [];

  agents: any[] = [];

  // callAuditData: any = [];
  displayedColumns: string[] = ['sNo', 'beneficiaryId', 'beneficiaryName', 'phoneNumber', 'agentName', 'callType' ,'casesheet','action'];
  searchTerm: any;

  callAuditData = new MatTableDataSource();
  @ViewChild(MatSort, { static: false })sort!: MatSort; 
  @ViewChild(MatPaginator, {static: false}) paginator!: MatPaginator;
  callData: any=[];
  years: any = [];
  months: any = [];
  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth() + 1;
  cycles: any = [];
  phoneNo: any;
  date = new Date();
 
  showQualityAuditWorklist: boolean = false;
 range  = new FormGroup({
    start: new FormControl('', [Validators.required]),
    end: new FormControl('', [Validators.required])
  });
  showAgentId: boolean = false;
  
  selectedFormValue: any = [];
  selectedDateFormValue: any = [];
  today = new Date();

  ngAfterViewInit() {
    this.callAuditData.paginator = this.paginator;
    this.callAuditData.sort = this.sort;
  }

  constructor(
    private fb: FormBuilder,
    private setLanguageService: SetLanguageService,
    private qualityAuditorService: QualityAuditorService,
    private masterService: MasterService,
    private confirmationService: ConfirmationService,
    private changeDetectorRefs: ChangeDetectorRef,
  ) { }

  callAuditForm = this.fb.group({
    selectedRadioButton: new FormControl('', [Validators.required]),
  });
  dateWiseForm = this.fb.group({
    role: ['', Validators.required],
    roleId: [''],
    language: ['', Validators.required],
    agentId: ['', Validators.required],
    isValid: ['', Validators.required],
    startTime:[''],
    endTime:[''],
    phoneNo: new FormControl(''),
    start: new FormControl('', [Validators.required]),
    end: new FormControl('', [Validators.required])
  });
  cycleWiseForm = this.fb.group({
    role: ['', Validators.required],
    roleId: [''],
    language: ['', Validators.required],
    agentId: ['', Validators.required],
    isValid: ['', Validators.required],
    month: ['', Validators.required],
    year: ['', Validators.required],
    cycle: ['', Validators.required]
  });

  ngOnInit(): void {
   
    this.getSelectedLanguage();
    this.getRoleMasters();
    this.getCyclesMaster();
    this.getLanguageMaster();
    for (let i = this.currentYear - 5; i <= this.currentYear; i++) {
      this.years.push(i);
    }
    this.callAuditForm.controls['selectedRadioButton'].setValue('1');
    this.iscycleWiseChangeForm = true;
    if(this.qualityAuditorService.showForm === false){
    if (this.qualityAuditorService.callAuditData !== undefined && this.qualityAuditorService.callAuditData !== null && this.qualityAuditorService.isCycleWiseForm === true ){
      this.callAuditForm.controls['selectedRadioButton'].setValue('1');
      this.iscycleWiseChangeForm = true;
    this.cycleWiseForm.patchValue(this.qualityAuditorService.callAuditData);
     this.getMonths();
     this.getAgentByRole();
     this.getQualityAudiotorWorklist();
    }else{
      if(this.qualityAuditorService.callAuditData !== undefined && this.qualityAuditorService.callAuditData !== null){
      this.callAuditForm.controls['selectedRadioButton'].setValue('2');
      this.iscycleWiseChangeForm = false;
      this.dateWiseForm.patchValue(this.qualityAuditorService.callAuditData);
      this.getAgentByRole();
      this.getDateWiseAudiotorWorklist();
    }
  }}
  }
  
  getSelectedLanguage() {
    if (
      this.setLanguageService.languageData !== undefined &&
      this.setLanguageService.languageData !== null
    )
      this.currentLanguageSet = this.setLanguageService.languageData;
  }

  getMonths(){
    const selectedYear = this.cycleWiseForm.controls.year.value ? parseInt(this.cycleWiseForm.controls.year.value.toString(),10) : 0;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    if (selectedYear === currentYear) {
      this.months = [];
      for (let i = 1; i <= currentMonth; i++) {
        const monthName = new Date(selectedYear, i - 1, 1).toLocaleString('default', { month: 'long' });
        this.months.push({ month: monthName, id: i });
      }
      // const start = startOfMonth(this.currentDate);
      // const end = endOfMonth(this.currentDate);
      // let date = start;
      // this.months = [];
      // while (date <= end) {
      //   this.months.push(date.toLocaleString('default', { month: 'long' }));
      //   date = addMonths(date, 1);
      // }
    } else {
      this.months = [];
      for (let i = 1; i <= 12; i++) {
        const monthName = new Date(2000, i - 1, 1).toLocaleString('default', { month: 'long' });
        this.months.push({ month: monthName, id: i });
      }
    }
  }
  
  getRoleMasters(){
    let psmId = sessionStorage.getItem('providerServiceMapID');
    this.masterService.getRoleMaster(psmId).subscribe((res: any) => {
      if(res && res.length > 0){
        res.filter((role: any) => {
          if(role.roleName.toLowerCase() === "anm" || role.roleName.toLowerCase() === "mo" || role.roleName.toLowerCase() === "associate"){
            this.roles.push(role)
          }
        })
      }else {
        this.confirmationService.openDialog(this.currentLanguageSet.noRolesFound, 'error');
      }
    },
    (err: any) => {
      this.confirmationService.openDialog(err.error, 'error');
    }
    );
  }

  getCyclesMaster(){
    let psmId = sessionStorage.getItem('providerServiceMapID');
    this.masterService.getCyclesMaster(psmId).subscribe((res: any) => {
      if(res && res.length > 0){
        this.cycles = res;
      }else {
        this.confirmationService.openDialog(this.currentLanguageSet.noCyclesFound, 'error');
      }
    },
    (err: any) => {
      this.confirmationService.openDialog(err.error, 'error');
    }
    );
  }

  getLanguageMaster(){
    let userId = sessionStorage.getItem('userId');
    this.masterService.getLanguageMasterByUserId(userId).subscribe((res: any) => {
      if(res && res.length > 0){
        this.languages = res;
      }else {
        this.confirmationService.openDialog(this.currentLanguageSet.noLanguagesFound, 'error');
      }
    },
    (err: any) => {
      this.confirmationService.openDialog(err.error, 'error');
    }
    );
  }

  getAgentByRole(){
    if(this.callAuditForm.controls['selectedRadioButton'].value === '1'){
    // if (this.qualityAuditorService.callAuditData === undefined &&  this.qualityAuditorService.callAuditData[0].selectedRadioButton === '1' ){
    // this.cycleWiseForm.controls.agentId.reset();
    // this.dateWiseForm.controls.agentId.reset();
    // }
    let roleId = this.cycleWiseForm.controls.roleId.value;
    let role = this.cycleWiseForm.controls.role.value;
    this.masterService.getAgentMasterByRoleId(roleId).subscribe((res: any) => {
      if(res && res.length > 0){
        this.agents = res;
      }else {
        this.confirmationService.openDialog(this.currentLanguageSet.noAgentsFoundFor + role + this.currentLanguageSet.role, 'error');
      }
    },
    (err: any) => {
      this.confirmationService.openDialog(err.error, 'error');
    }
    );
  }else{
    // if (this.qualityAuditorService.callAuditData === undefined && this.qualityAuditorService.callAuditData[0].selectedRadioButton === '2'){
    //   this.cycleWiseForm.controls.agentId.reset();
    //   this.dateWiseForm.controls.agentId.reset();
    //   }
      let roleId = this.dateWiseForm.controls.roleId.value;
      let role = this.dateWiseForm.controls.role.value;
      this.masterService.getAgentMasterByRoleId(roleId).subscribe((res: any) => {
        if(res && res.length > 0){
          this.agents = res;
        }else {
          this.confirmationService.openDialog(this.currentLanguageSet.noAgentsFoundFor + role + this.currentLanguageSet.role, 'error');
        }
      },
      (err: any) => {
        this.confirmationService.openDialog(err.error, 'error');
      }
      );
  }
  }

  getRoleId(){
    if(this.callAuditForm.controls['selectedRadioButton'].value === '1'){
      this.cycleWiseForm.controls['agentId'].reset()
    // this.cycleWiseForm.controls['agentId'].markAsPristine();
    
    let role = this.cycleWiseForm.controls.role.value;
    this.roles.filter((item: any) => {
      if(item.roleName == role)
      this.cycleWiseForm.controls.roleId.patchValue(item.roleId);
    });
  }else{
    this.dateWiseForm.controls.agentId.reset();
    let role = this.dateWiseForm.controls.role.value;
    this.roles.filter((item: any) => {
      if(item.roleName == role)
      this.dateWiseForm.controls.roleId.patchValue(item.roleId);
    });
  }
  }
  getRoleNames(){
    if(this.callAuditForm.controls['selectedRadioButton'].value === '1'){
    let role = this.qualityAuditorService.callAuditData.roleId;
    this.roles.filter((item: any) => {
      if(item.roleId == role)
      this.cycleWiseForm.controls.role.patchValue(item.rolename);
    });
  }else{
    let role = this.qualityAuditorService.callAuditData.roleId;
    this.roles.filter((item: any) => {
      if(item.roleId == role)
      this.dateWiseForm.controls.role.patchValue(item.rolename);
    });
  }
  }
  
  routeToAgentRating(data: any, auditType: String){
    this.qualityAuditorService.loadComponent(CallRatingComponent, {data: data, type: auditType});
    console.log("route required", data)
  }

  filterSearchTerm(searchTerm?: string) {
    if (!searchTerm) {
      this.callAuditData.data = this.callData;
      this.callAuditData.paginator = this.paginator;
      this.callAuditData.sort = this.sort;
    } else {
      this.callAuditData.data = [];
      this.callAuditData.paginator = this.paginator;
      this.callAuditData.sort = this.sort;
      this.callData.forEach((item: any) => {
        for (let key in item) {
          if (
            key == 'beneficiaryid' ||
            key == 'beneficiaryname' ||
            key == 'phoneNo' ||
            key == 'agetname'
          ) {
            let value: string = '' + item[key];
            if (value.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0) {
              this.callAuditData.data.push(item);
              this.callAuditData.paginator = this.paginator;
              this.callAuditData.sort = this.sort;
              break;
            }
          }
        }
      });
    }
  }

  getQualityAudiotorWorklist(){
    if(this.callAuditForm.controls['selectedRadioButton'].value === '1'){
      let reqObj = {
      psmId: sessionStorage.getItem('providerServiceMapID'),
      languageId: this.cycleWiseForm.controls.language.value,
      agentId: this.cycleWiseForm.controls.agentId.value,
      roleId: this.cycleWiseForm.controls.roleId.value,
      isValid: (this.cycleWiseForm.controls.isValid.value == "true") ? true : false,
      year: this.cycleWiseForm.controls.year.value,
      month: this.cycleWiseForm.controls.month.value,
      cycleId: this.cycleWiseForm.controls.cycle.value,
      fromDate: null,
      toDate: null
    }
    this.qualityAuditorService.isCycleWiseForm = this.iscycleWiseChangeForm ;
  this.qualityAuditorService.callAuditData = null;
   this.qualityAuditorService.callAuditData = this.cycleWiseForm.value;
   console.log(this.qualityAuditorService.callAuditData);
    this.qualityAuditorService.getQualityAuditorWorklist(reqObj).subscribe((res: any) => {
      if(res && res.length > 0){
        this.callData = res;
        this.refresh(res);
      } else if(res.length <= 0) {
        this.confirmationService.openDialog(this.currentLanguageSet.noDataFoundForCallRating, 'error');
        this.callData = [];
        this.callAuditData.data = [];
        this.callAuditData.paginator = this.paginator;      
      } else {
        this.confirmationService.openDialog(res.errorMessage, 'error');
        this.callData = [];
        this.callAuditData.data = [];
        this.callAuditData.paginator = this.paginator;  
      }
    },
    (err: any) => {
      this.confirmationService.openDialog(err.error, 'error');
    }
    );
  }
    
  else{
    this.getDateWiseAudiotorWorklist();
  }
}
  getDateWiseAudiotorWorklist(){
    let fromDate =  moment(this.dateWiseForm.controls.start.value).format('YYYY-MM-DDThh:mm:ssZ');
    let toDate =  moment(this.dateWiseForm.controls.end.value).format('YYYY-MM-DDThh:mm:ssZ');   
    let reqObj = {
      psmId: sessionStorage.getItem('providerServiceMapID'),
      languageId: this.dateWiseForm.controls.language.value,
      agentId: this.dateWiseForm.controls.agentId.value,
      roleId: this.dateWiseForm.controls.roleId.value,
      isValid: (this.dateWiseForm.controls.isValid.value == "true") ? true : false,
      validFrom: fromDate,
      validTill: toDate,
      cycleId: null,
      beneficiaryPhoneNumber : this.dateWiseForm.controls.phoneNo.value
      
    }
    this.qualityAuditorService.isCycleWiseForm = this.iscycleWiseChangeForm ;
    this.qualityAuditorService.callAuditData = null;
    this.qualityAuditorService.callAuditData = this.dateWiseForm.value;
    console.log(this.qualityAuditorService.callAuditData);
     this.qualityAuditorService.getQualityAuditorDateWorklist(reqObj).subscribe((res: any) => {
       if(res && res.length > 0){
         this.callData = res;
         this.refresh(res);
       } else if(res.length <= 0) {
         this.confirmationService.openDialog(this.currentLanguageSet.noDataFoundForCallRating, 'error');
         this.callData = [];
         this.callAuditData.data = [];
         this.callAuditData.paginator = this.paginator;      
       } else {
         this.confirmationService.openDialog(res.errorMessage, 'error');
         this.callData = [];
         this.callAuditData.data = [];
         this.callAuditData.paginator = this.paginator;  
       }
     },
     (err: any) => {
       this.confirmationService.openDialog(err.error, 'error');
     }
     );
  }

  refresh(res: any){
    this.changeDetectorRefs.detectChanges();
    this.callData = res;
    this.callAuditData.data = res;
    this.callAuditData.paginator = this.paginator;
  }
  viewCasheet(element:any){
    let reqObj={
      benCallId:element.benCallID,
      beneficiaryId:element.beneficiaryid
    }
    this.qualityAuditorService.loadComponent(
      ViewCasesheetComponent,
      reqObj
    );
  }
  invalidTimeFlag = false;
  validateTime(start_date: any, end_date: any, start_time: any, end_time: any) {
    if (start_time === undefined && end_time === undefined && start_time ==="" && end_time ==="") {
    }
    if (start_time != undefined && start_time != "" && end_time != undefined && end_time != "" && start_date.getDate() != undefined && start_date.getDate() != "" && end_date.getDate() != undefined && end_date.getDate() != ""
    ) {
      if (
        start_date.getDate() === end_date.getDate() &&
        start_time > end_time
      ) {
        this.invalidTimeFlag = true;
      }
      if (
        start_date.getDate() === end_date.getDate() &&
        start_time < end_time
      ) {
        this.invalidTimeFlag = false;
      }
      if (
        start_date.getDate() === end_date.getDate() &&
        start_time === end_time
      ) {
        this.invalidTimeFlag = true;
      }
      if (start_date.getDate() != end_date.getDate()) {
        this.invalidTimeFlag = false;
      }
    }
  }
  onRadioButtonChange(){
    if(this.callAuditForm.controls['selectedRadioButton'].value === '1') {
      // this.selectedRadioButtonChange = true;
      this.iscycleWiseChangeForm = false;
    } else{
      this.iscycleWiseChangeForm = true;
    }
    this.callAuditForm.reset();
    // this.range.reset();
    this.cycleWiseForm.reset();
    this.dateWiseForm.reset();
    this.callData = [];
    this.callAuditData.data = [];
    this.callAuditData.paginator = this.paginator; 
  }
  // agentIdSelection(){
  // if(this.agents[i].agentId !== undefined && this.agents[i].agentId !== null){
  // this.showAgentId = true;
  // }
  // else{
  //   this.showAgentId = false;
  // }
  // }
}
