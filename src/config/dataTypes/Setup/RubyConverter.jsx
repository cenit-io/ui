import React from "react";
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";
import SharedCode from "../../../components/SharedCode";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const fields = ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'source_handler', 'code'];

export default {
  title: 'Ruby Converter',
  icon: <ConverterFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'source_handler', 'updated_at']
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
