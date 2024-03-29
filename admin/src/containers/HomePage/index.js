/*
 *
 * HomePage
 *
 */
/* eslint-disable */
import React, { memo, useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { get, upperFirst } from "lodash";
import { auth, LoadingIndicatorPage } from "strapi-helper-plugin";
import PageTitle from "../../components/PageTitle";
import { useModels } from "../../hooks";

import useFetch from "./hooks";
import {
  ALink,
  Block,
  Container,
  LinkWrapper,
  P,
  Wave,
  Separator,
} from "./components";
import BlogPost from "./BlogPost";
import SocialLink from "./SocialLink";

const FIRST_BLOCK_LINKS = [
  {
    link: "https://strapi.io/documentation/developer-docs/latest/getting-started/quick-start.html#_4-create-a-category-content-type",
    contentId: "app.components.BlockLink.documentation.content",
    titleId: "app.components.BlockLink.documentation",
  },
  {
    link: "https://github.com/strapi/foodadvisor",
    contentId: "app.components.BlockLink.code.content",
    titleId: "app.components.BlockLink.code",
  },
];

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    link: "https://github.com/strapi/strapi/",
  },
  {
    name: "Discord",
    link: "https://discord.strapi.io/",
  },
  {
    name: "Reddit",
    link: "https://www.reddit.com/r/Strapi/",
  },
  {
    name: "Twitter",
    link: "https://twitter.com/strapijs",
  },
  {
    name: "Blog",
    link: "https://strapi.io/blog",
  },
  {
    name: "Forum",
    link: "https://forum.strapi.io",
  },
  {
    name: "Careers",
    link: "https://strapi.io/careers",
  },
];

const HomePage = ({ history: { push } }) => {
  const { error, isLoading, posts } = useFetch();
  // Temporary until we develop the menu API
  const {
    collectionTypes,
    singleTypes,
    isLoading: isLoadingForModels,
  } = useModels();

  const handleClick = (e) => {
    e.preventDefault();

    push(
      "/plugins/content-type-builder/content-types/plugins::users-permissions.user?modalType=contentType&kind=collectionType&actionType=create&settingType=base&forTarget=contentType&headerId=content-type-builder.modalForm.contentType.header-create&header_icon_isCustom_1=false&header_icon_name_1=contentType&header_label_1=null"
    );
  };

  const hasAlreadyCreatedContentTypes = useMemo(() => {
    const filterContentTypes = (contentTypes) =>
      contentTypes.filter((c) => c.isDisplayed);

    return (
      filterContentTypes(collectionTypes).length > 1 ||
      filterContentTypes(singleTypes).length > 0
    );
  }, [collectionTypes, singleTypes]);

  if (isLoadingForModels) {
    return <LoadingIndicatorPage />;
  }

  const headerId = hasAlreadyCreatedContentTypes
    ? "HomePage.greetings"
    : "app.components.HomePage.welcome";
  const username = get(auth.getUserInfo(), "firstname", "");
  const linkProps = hasAlreadyCreatedContentTypes
    ? {
        id: "app.components.HomePage.button.blog",
        href: "https://strapi.io/blog/",
        onClick: () => {},
        type: "blog",
        target: "_blank",
      }
    : {
        id: "app.components.HomePage.create",
        href: "",
        onClick: handleClick,
        type: "documentation",
      };

  return (
    <div style={{ padding: "50px" }}>
      <h1>Dobrodošli na Admin panel</h1>
      <br />
      <h2 style={{ color: "#6b6b6b" }}>
        Koristite meni s lijeve strane da pristupite i upravljate sadržajem.
      </h2>
      <br />
      <ul style={{ fontSize: "18px" }}>
        <li>
          <span style={{ fontWeight: "bold" }}>Books</span> - panel za
          upravljanje knjigama
        </li>
        <li>
          <span style={{ fontWeight: "bold" }}>Categories</span> - panel za
          upravljanje kategorijama
        </li>
        <li>
          <span style={{ fontWeight: "bold" }}>Users</span> - panel za
          upravljanje korisnicima
        </li>
      </ul>
    </div>
  );
};

export default memo(HomePage);
