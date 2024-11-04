import axios from "axios"; // Requests wrapper
import dayjs from "dayjs"; // Dayjs
import { useContext, useState } from "react"; // State management
import Layout from "components/layout"; // Layout wrapper
import APICTA from "components/api_cta"; // API CTA
import { web3p, vote } from "containers"; // Context
import styles from "styles/page.module.scss"; // Page styles
import BeatLoader from "react-spinners/BeatLoader"; // Loading state
import { Embedded } from "containers"; // Embedded

export default function Home() {
  return "Comp.Vote is down until Nov 8th.";
}