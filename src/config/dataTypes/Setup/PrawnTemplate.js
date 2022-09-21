import React from "react";
import TemplateFilledIcon from "../../../icons/TemplateFilledIcon";
import SharedCode from "../../../components/SharedCode";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const fields = ['namespace', 'name', 'source_data_type', 'bulk_source', 'code'];

export default {
  title: 'Prawn Template',
  icon: <TemplateFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'source_data_type', 'bulk_source', 'updated_at']
    },
    new: { fields },
    edit: {
      viewportFields: [...fields, 'origin']
    }
  },
  fields: {
    code: {
      control: SharedCode,
      controlProps: {
        mime: 'text/x-ruby'
      }
    }
  },
  orchestrator: sharedOriginFields(...arrayDiff(fields, 'code'))
};
