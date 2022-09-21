import React from "react";
import TemplateFilledIcon from "../../../icons/TemplateFilledIcon";
import AutocompleteControl from "../../../components/AutocompleteControl";
import templateMimeOrchestrator from "../../orchestrators/templateMimeOrchestrator";
import { arrayDiff } from "../../../common/arrays";
import SharedCode from "../../../components/SharedCode";

const fields = ['namespace', 'name', 'source_data_type', 'mime_type', 'file_extension', 'bulk_source', 'code'];

const orchestrator = templateMimeOrchestrator(arrayDiff(fields, 'code'));

export default {
  title: 'ERB Template',
  icon: <TemplateFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'source_data_type', 'mime_type', 'file_extension', 'bulk_source', 'updated_at']
    },
    new: { fields },
    edit: {
      viewportFields: [...fields, 'origin']
    }
  },
  fields: {
    mime_type: {
      control: AutocompleteControl
    },
    file_extension: {
      control: AutocompleteControl
    },
    code: {
      control: SharedCode
    }
  },
  orchestrator
};
