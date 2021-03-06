import { Component, OnInit, ViewChild } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Router } from '@angular/router'

import { NotificationsService } from 'angular2-notifications'

import {
  FormReactive,
  VIDEO_NAME,
  VIDEO_CATEGORY,
  VIDEO_LICENCE,
  VIDEO_LANGUAGE,
  VIDEO_DESCRIPTION,
  VIDEO_TAGS,
  VIDEO_FILE
} from '../../shared'
import { ServerService } from '../../core'
import { VideoService } from '../shared'
import { VideoCreate } from '../../../../../shared'
import { HttpEventType, HttpResponse } from '@angular/common/http'

@Component({
  selector: 'my-videos-add',
  styleUrls: [ './video-edit.component.scss' ],
  templateUrl: './video-add.component.html'
})

export class VideoAddComponent extends FormReactive implements OnInit {
  @ViewChild('videofileInput') videofileInput

  progressPercent = 0
  tags: string[] = []
  videoCategories = []
  videoLicences = []
  videoLanguages = []

  tagValidators = VIDEO_TAGS.VALIDATORS
  tagValidatorsMessages = VIDEO_TAGS.MESSAGES

  error: string
  form: FormGroup
  formErrors = {
    name: '',
    category: '',
    licence: '',
    language: '',
    description: '',
    videofile: ''
  }
  validationMessages = {
    name: VIDEO_NAME.MESSAGES,
    category: VIDEO_CATEGORY.MESSAGES,
    licence: VIDEO_LICENCE.MESSAGES,
    language: VIDEO_LANGUAGE.MESSAGES,
    description: VIDEO_DESCRIPTION.MESSAGES,
    videofile: VIDEO_FILE.MESSAGES
  }

  constructor (
    private formBuilder: FormBuilder,
    private router: Router,
    private notificationsService: NotificationsService,
    private serverService: ServerService,
    private videoService: VideoService
  ) {
    super()
  }

  get filename () {
    return this.form.value['videofile']
  }

  buildForm () {
    this.form = this.formBuilder.group({
      name: [ '', VIDEO_NAME.VALIDATORS ],
      nsfw: [ false ],
      category: [ '', VIDEO_CATEGORY.VALIDATORS ],
      licence: [ '', VIDEO_LICENCE.VALIDATORS ],
      language: [ '', VIDEO_LANGUAGE.VALIDATORS ],
      description: [ '', VIDEO_DESCRIPTION.VALIDATORS ],
      videofile: [ '', VIDEO_FILE.VALIDATORS ],
      tags: [ '' ]
    })

    this.form.valueChanges.subscribe(data => this.onValueChanged(data))
  }

  ngOnInit () {
    this.videoCategories = this.serverService.getVideoCategories()
    this.videoLicences = this.serverService.getVideoLicences()
    this.videoLanguages = this.serverService.getVideoLanguages()

    this.buildForm()
  }

  // The goal is to keep reactive form validation (required field)
  // https://stackoverflow.com/a/44238894
  fileChange ($event) {
    this.form.controls['videofile'].setValue($event.target.files[0].name)
  }

  removeFile () {
    this.videofileInput.nativeElement.value = ''
    this.form.controls['videofile'].setValue('')
  }

  checkForm () {
    this.forceCheck()

    return this.form.valid
  }

  upload () {
    if (this.checkForm() === false) {
      return
    }

    const formValue: VideoCreate = this.form.value

    const name = formValue.name
    const nsfw = formValue.nsfw
    const category = formValue.category
    const licence = formValue.licence
    const language = formValue.language
    const description = formValue.description
    const tags = formValue.tags
    const videofile = this.videofileInput.nativeElement.files[0]

    const formData = new FormData()
    formData.append('name', name)
    formData.append('category', '' + category)
    formData.append('nsfw', '' + nsfw)
    formData.append('licence', '' + licence)
    formData.append('videofile', videofile)

    // Language is optional
    if (language) {
      formData.append('language', '' + language)
    }

    formData.append('description', description)

    for (let i = 0; i < tags.length; i++) {
      formData.append(`tags[${i}]`, tags[i])
    }

    this.videoService.uploadVideo(formData).subscribe(
      event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progressPercent = Math.round(100 * event.loaded / event.total)
        } else if (event instanceof HttpResponse) {
          console.log('Video uploaded.')
          this.notificationsService.success('Success', 'Video uploaded.')

          // Display all the videos once it's finished
          this.router.navigate([ '/videos/list' ])
        }
      },

      err => {
        // Reset progress
        this.progressPercent = 0
        this.error = err.message
      }
    )
  }
}
