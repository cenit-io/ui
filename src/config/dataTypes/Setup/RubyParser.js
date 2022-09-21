import React from "react";
import ParserFilledIcon from "../../../icons/ParserFilledIcon";
import SharedCode from "../../../components/SharedCode";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";
import { arrayDiff } from "../../../common/arrays";

const fields = ['namespace', 'name', 'target_data_type', 'discard_events', 'code'];

export default {
  title: 'Ruby Parser',
  icon: <ParserFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'target_data_type', 'discard_events', 'updated_at']
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
