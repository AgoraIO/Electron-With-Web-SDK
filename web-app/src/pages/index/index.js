import 'bulma/css/bulma.css'
import '@/assets/fonts/css/icons.css'
// import * as Cookies from 'js-cookie'

import '@/assets/global.css'
import './index.css'
import {
  RESOLUTION_ARR
} from '@/utils/Settings'
import Validator from '@/utils/Validate'
import {
  save
} from '@/utils/Storage'


(function ($) {
  $(() => {

    const polyfill = (() => {
      // Object.entries
      if (!Object.entries)
        Object.entries = function (obj) {
          var ownProps = Object.keys(obj),
            i = ownProps.length,
            resArray = new Array(i); // preallocate the Array
          while (i--)
            resArray[i] = [ownProps[i], obj[ownProps[i]]];

          return resArray;
        }
    })();

    const getParameterByName = (name, url) => {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    const UIInit = () => {
      let profileContainer = $("#videoProfile")
      Object.entries(RESOLUTION_ARR).map(item => {
        let html = '<option ' + (item[0] == "480p_4" ? "selected" : "") + ' value="' + item[0] + '">' + item[1][0] + 'x' + item[1][1] + ', ' + item[1][2] + 'fps, ' + item[1][3] + 'kbps</option>'
        profileContainer.append(html)
      })
      let audienceOnly = getParameterByName("audienceOnly") === "true";
      if (audienceOnly) {
        $("#attendeeMode label.audience").siblings().hide();
        $("#attendeeMode label.audience input").prop("checked", true);
      }
    }

    const dropDownControl = () => {
      let $dropdowns = document.querySelectorAll('.dropdown:not(.is-hoverable)')

      if ($dropdowns.length > 0) {
        $dropdowns.forEach(function ($el) {
          $el.addEventListener('click', function (event) {
            closeDropdowns()
            event.stopPropagation()
            $el.classList.toggle('is-active')
          })
        })

        document.addEventListener('click', function (event) {
          closeDropdowns()
        })
      }

      function closeDropdowns() {
        $dropdowns.forEach(function ($el) {
          $el.classList.remove('is-active')
        })
      }
    }

    const dropDownSelectControl = () => {
      let label = document.querySelector('#baseOptionLabel')
      let select = document.querySelector('#baseMode')
      let options = document.querySelectorAll('#baseModeOptions .dropdown-item')
      options.forEach(item => {
        item.addEventListener('click', function (event) {
          event.stopPropagation()
          select.dataset.value = item.dataset.value
          label.innerHTML = item.dataset.msg
          select.parentNode.parentNode.classList.remove('is-active')
        })
      })
    }

    const subscribeMouseEvent = () => {

      $('#joinBtn').on('click', () => {
        let validateRst = validate($('#channel').val().trim())
        let validateIcon = $('.validate-icon')
        validateIcon.empty()
        if (validateRst) {
          let msg = `Input Error: ${validateRst}`
          $('#channel').addClass('is-danger')
          validateIcon.append(`<i class="ag-icon ag-icon-invalid"></i>`)
          $('.validate-msg').html(msg).show()
          return 0
        } else {
          $('#channel').addClass('is-success')
          validateIcon.append(`<i class="ag-icon ag-icon-valid"></i>`)
        }

        let postData = {
          'baseMode': document.querySelector('#baseMode').dataset.value,
          'transcode': $('input[name="transcode"]:checked').val(),
          'attendeeMode': $('input[name="attendee"]:checked').val(),
          'videoProfile': $('#videoProfile').val(),
          'channel': $('#channel').val().trim()
        }

        // Object.entries(postData).map(item => {
        //   Cookies.set(item[0], item[1])
        // })
        Object.entries(postData).map(item => {
          save(item[0], item[1])
        })

        window.location.href = "meeting.html"
      })

      document.querySelector('#channel').addEventListener('input', () => {
        $('#channel').removeClass('is-danger')
        $('#channel').removeClass('is-success')
        $('.validate-msg').hide()
        let validateRst = validate($('#channel').val().trim())
        let validateIcon = $('.validate-icon')
        validateIcon.empty()
        if (validateRst) {
          let msg = `Input Error: ${validateRst}`
          $('#channel').addClass('is-danger')
          validateIcon.append(`<i class="ag-icon ag-icon-invalid"></i>`)
          $('.validate-msg').html(msg).show()
          return 0
        } else {
          $('#channel').addClass('is-success')
          validateIcon.append(`<i class="ag-icon ag-icon-valid"></i>`)
        }
      })

    }

    const validate = (channelName) => {
      if (Validator.isNonEmpty(channelName)) {
        return 'Cannot be empty!'
      }
      if (Validator.minLength(channelName, 1)) {
        return 'No shorter than 1!'
      }
      if (Validator.maxLength(channelName, 16)) {
        return 'No longer than 16!'
      }
      if (Validator.validChar(channelName)) {
        return 'Only capital or lower-case letter, number and "_" are permitted!'
      }

      return ''
    }

    // ----------------start-------------------
    // ----------------------------------------
    (function () {
      UIInit()
      dropDownControl()
      dropDownSelectControl()
      subscribeMouseEvent()
    })()

  })
}(jQuery))
